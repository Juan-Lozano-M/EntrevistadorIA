package com.interviewai.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.interviewai.auth.CurrentUser;
import com.interviewai.auth.User;
import com.interviewai.auth.UserRepository;
import com.interviewai.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class BillingService {
    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    /** Outcome of starting a subscription. status = "authorized" | "challenge" | "pending". */
    public record SubscribeResult(String status, String paymentId, String externalResourceUrl, String creq) {}

    private final MercadoPagoClient mp;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final String frontendUrl;
    private final String publicKey;
    private final String currency;
    private final double amount;
    private final String webhookUrl;
    private final String backUrlOverride;

    public BillingService(MercadoPagoClient mp, UserRepository users, CurrentUser currentUser,
                          @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
                          @Value("${app.billing.mercadopago.public-key:}") String publicKey,
                          @Value("${app.billing.mercadopago.currency:MXN}") String currency,
                          @Value("${app.billing.mercadopago.amount:199}") double amount,
                          @Value("${app.billing.mercadopago.webhook-url:}") String webhookUrl,
                          @Value("${app.billing.mercadopago.back-url:}") String backUrlOverride) {
        this.mp = mp; this.users = users; this.currentUser = currentUser;
        this.frontendUrl = frontendUrl; this.publicKey = publicKey; this.currency = currency;
        this.amount = amount; this.webhookUrl = webhookUrl; this.backUrlOverride = backUrlOverride;
    }

    /** Public config the SPA needs to render the embedded card form. */
    public Map<String, Object> publicConfig() {
        return Map.of("publicKey", publicKey == null ? "" : publicKey, "currency", currency, "amount", amount);
    }

    /** Where the /return endpoint bounces the browser back to (the SPA). */
    public String spaReturnUrl() {
        return frontendUrl + "/app/configuracion?pago=success";
    }

    /** MercadoPago rejects localhost; use the public backend (ngrok) /return redirect, or an override. */
    private String backUrl() {
        if (backUrlOverride != null && !backUrlOverride.isBlank()) return backUrlOverride;
        if (webhookUrl != null && !webhookUrl.isBlank()) {
            return webhookUrl.replaceAll("/api/billing/webhook/?$", "").replaceAll("/+$", "") + "/api/billing/return";
        }
        return frontendUrl + "/app/configuracion?pago=success";
    }

    /** Webhook público bien formado (MP_WEBHOOK_URL puede venir como dominio pelado). */
    private String notificationUrl() {
        if (webhookUrl == null || webhookUrl.isBlank()) return null;
        String base = webhookUrl.replaceAll("/+$", "");
        return base.endsWith("/api/billing/webhook") ? base : base + "/api/billing/webhook";
    }

    /** Crea la suscripción (preapproval) por REDIRECCIÓN: sin tokenizar la tarjeta aquí.
     *  MercadoPago aloja la página donde el usuario ingresa la tarjeta; devolvemos su init_point
     *  para redirigir el navegador. Al confirmarse, el webhook activa Premium (applyStatus). */
    @Transactional
    public SubscribeResult subscribe(SubscribeRequest req) {
        User u = currentUser.require();
        if (!mp.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                "Los pagos no están configurados (falta MP_ACCESS_TOKEN)");
        }
        if ("PREMIUM".equals(u.getPlan())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya tienes una suscripción Premium activa");
        }
        String token = (req.tokenSub() != null && !req.tokenSub().isBlank()) ? req.tokenSub() : req.tokenPay();
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el token de la tarjeta");
        }

        // Cobro embebido con /v1/payments (la suscripción/preapproval está rota en esta cuenta).
        // Pago único: activa Premium al aprobarse; todo ocurre en el sitio, sin redirección.
        Map<String, Object> payer = new HashMap<>();
        payer.put("email", u.getEmail());
        if (req.idNumber() != null && !req.idNumber().isBlank()) {
            payer.put("identification", Map.of("type", req.idType(), "number", req.idNumber()));
        }
        Map<String, Object> body = new HashMap<>();
        body.put("transaction_amount", amount);
        body.put("token", token);
        body.put("description", "InterviewAI Premium");
        body.put("installments", 1);
        if (req.paymentMethodId() != null && !req.paymentMethodId().isBlank()) {
            body.put("payment_method_id", req.paymentMethodId());
        }
        body.put("payer", payer);

        log.info("[billing] cobrando Premium (/v1/payments) payer={} amount={} {}", u.getEmail(), amount, currency);
        JsonNode p = mp.createPayment(body);
        String status = p.path("status").asText("");
        String detail = p.path("status_detail").asText("");
        String payId = p.path("id").asText(null);
        log.info("[billing] pago {} -> status={} detail={}", payId, status, detail);

        if ("approved".equals(status)) {
            u.setPlan("PREMIUM");
            u.setSubscriptionStatus("active");
            u.setMpPreapprovalId(payId);
            u.setCardBrand(req.cardBrand());
            u.setCardLast4(req.cardLast4());
            users.save(u);
            return new SubscribeResult("authorized", payId, null, null);
        }
        if ("rejected".equals(status)) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, friendlyDetail(detail));
        }
        // in_process / pending: aún no Premium; el usuario verá "en revisión".
        u.setSubscriptionStatus(status);
        users.save(u);
        return new SubscribeResult("pending", payId, null, null);
    }

    /** Paso 1 del flujo de suscripción: crea/recupera el customer y guarda la tarjeta en él.
     *  Devuelve el cardId para que el frontend re-tokenice la tarjeta guardada.
     *  NO es @Transactional a propósito: el mp_customer_id debe persistir aunque el guardado
     *  de la tarjeta falle, para no volver a crear un customer duplicado ("already exist"). */
    public Map<String, Object> prepareCard(String cardToken) {
        User u = currentUser.require();
        if (!mp.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Los pagos no están configurados");
        }
        if (cardToken == null || cardToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el token de la tarjeta");
        }

        String customerId = u.getMpCustomerId();
        log.info("[billing] prepareCard email={} customerIdGuardado={}", u.getEmail(), customerId);

        if (customerId == null || customerId.isBlank()) {
            // Prueba varios emails candidatos. MP rechaza '+' (612) y a veces el email real
            // "ya existe" pero no es buscable; los alias con punto / dominio propio sí se crean.
            for (String candidate : candidateEmails(u)) {
                customerId = findCustomerByEmail(candidate);
                if (customerId == null) customerId = createCustomerSafe(candidate);
                if (customerId != null) break;
            }

            if (customerId == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo preparar el cliente de pago");
            }
            // Persiste de inmediato (este método no es transaccional) para no duplicar el customer.
            u.setMpCustomerId(customerId);
            users.save(u);
        }

        log.info("[billing] guardando tarjeta en customer={}", customerId);
        JsonNode card = mp.saveCard(customerId, Map.of("token", cardToken));
        String cardId = card.path("id").asText(null);
        if (cardId == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo guardar la tarjeta");
        }
        log.info("[billing] tarjeta guardada en customer {} (card {})", customerId, cardId);
        return Map.of("cardId", cardId);
    }

    /** Crea un customer con ese email; devuelve su id, o null si MP lo rechaza (p.ej. "ya existe"). */
    private String createCustomerSafe(String email) {
        try {
            JsonNode created = mp.createCustomer(Map.of("email", email));
            String id = created.path("id").asText(null);
            log.info("[billing] customer creado ({}) -> {}", email, id);
            return id;
        } catch (ApiException e) {
            log.info("[billing] create customer ({}) falló: {}", email, e.getMessage());
            return null;
        }
    }

    /** Emails candidatos para el customer, en orden. MP rechaza '+' (612), así que el alias usa
     *  un punto (mismo buzón en gmail) o un dominio propio; ambos son sintaxis válida y únicos. */
    private java.util.List<String> candidateEmails(User u) {
        String email = u.getEmail();
        int at = email.indexOf('@');
        String local = at > 0 ? email.substring(0, at) : email;
        String domain = at > 0 ? email.substring(at + 1) : "gmail.com";
        return java.util.List.of(
            email,                                       // 1) email real
            local + ".iav" + u.getId() + "@" + domain,   // 2) alias con punto (mismo buzón)
            "iav" + u.getId() + "@interviewai.app"       // 3) dominio propio (sintético, único)
        );
    }

    /** Busca un customer por email; devuelve su id o null. */
    private String findCustomerByEmail(String email) {
        JsonNode search = mp.searchCustomer(email);
        JsonNode results = search.path("results");
        if (results.isArray() && results.size() > 0) {
            String id = results.get(0).path("id").asText(null);
            log.info("[billing] customer existente encontrado por email -> {}", id);
            return id;
        }
        log.info("[billing] búsqueda de customer por email no devolvió resultados");
        return null;
    }

    /** DIAGNÓSTICO: crea un pago directo con el MISMO card_token para aislar si el problema
     *  es de /preapproval (token/credenciales/Secure Fields OK si este pago se crea). */
    @Transactional
    public Map<String, Object> testPayment(SubscribeRequest req) {
        User u = currentUser.require();
        if (!mp.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Los pagos no están configurados");
        }
        String token = (req.tokenSub() != null && !req.tokenSub().isBlank()) ? req.tokenSub() : req.tokenPay();
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el token de la tarjeta");
        }
        Map<String, Object> payer = new HashMap<>();
        payer.put("email", u.getEmail());
        if (req.idNumber() != null && !req.idNumber().isBlank()) {
            payer.put("identification", Map.of("type", req.idType(), "number", req.idNumber()));
        }
        Map<String, Object> body = new HashMap<>();
        body.put("transaction_amount", amount);
        body.put("token", token);
        body.put("description", "InterviewAI · diagnóstico");
        body.put("installments", 1);
        if (req.paymentMethodId() != null && !req.paymentMethodId().isBlank()) {
            body.put("payment_method_id", req.paymentMethodId());
        }
        body.put("payer", payer);

        log.info("[billing][diag] POST /v1/payments con token (payment_method_id={})", req.paymentMethodId());
        JsonNode p = mp.createPayment(body);
        return Map.of(
            "status", p.path("status").asText(""),
            "statusDetail", p.path("status_detail").asText(""),
            "id", p.path("id").asText(""));
    }

    /** Step 2: after the 3DS challenge, re-query the payment and finish if it was approved. */
    @Transactional
    public SubscribeResult confirm(ConfirmRequest req) {
        User u = currentUser.require();
        // Already activated (e.g. a previous poll won the race) — don't create a second subscription.
        if ("PREMIUM".equals(u.getPlan())) {
            return new SubscribeResult("authorized", null, null, null);
        }
        if (req.paymentId() == null || req.paymentId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el identificador del pago");
        }
        JsonNode payment = mp.getPayment(req.paymentId());
        return afterPayment(u, payment, req.cardToken(), req.cardLast4(), req.cardBrand());
    }

    private SubscribeResult afterPayment(User u, JsonNode payment, String tokenSub, String last4, String brand) {
        String status = payment.path("status").asText("");
        String detail = payment.path("status_detail").asText("");

        if ("approved".equals(status)) {
            createSubscription(u, tokenSub, last4, brand);
            return new SubscribeResult("authorized", null, null, null);
        }
        if ("pending".equals(status) && "pending_challenge".equals(detail)) {
            JsonNode tds = payment.path("three_ds_info");
            return new SubscribeResult("challenge", payment.path("id").asText(null),
                tds.path("external_resource_url").asText(null), tds.path("creq").asText(null));
        }
        if ("rejected".equals(status)) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, friendlyDetail(detail));
        }
        // in_process / other pending without challenge.
        return new SubscribeResult("pending", payment.path("id").asText(null), null, null);
    }

    /** Creates the recurring subscription starting next month (the first month is the payment above). */
    private void createSubscription(User u, String tokenSub, String last4, String brand) {
        Map<String, Object> autoRecurring = new HashMap<>();
        autoRecurring.put("frequency", 1);
        autoRecurring.put("frequency_type", "months");
        autoRecurring.put("transaction_amount", amount);
        autoRecurring.put("currency_id", currency);
        autoRecurring.put("start_date", OffsetDateTime.now().plusMonths(1).toString());

        Map<String, Object> body = new HashMap<>();
        body.put("reason", "InterviewAI Premium");
        body.put("auto_recurring", autoRecurring);
        body.put("back_url", backUrl());
        body.put("payer_email", u.getEmail());
        body.put("card_token_id", tokenSub);
        body.put("status", "authorized");
        if (webhookUrl != null && !webhookUrl.isBlank()) body.put("notification_url", webhookUrl);

        try {
            JsonNode resp = mp.createPreapproval(body);
            u.setMpPreapprovalId(resp.path("id").asText(null));
            u.setSubscriptionStatus(resp.path("status").asText("authorized"));
        } catch (RuntimeException e) {
            // The first month is already paid; if the recurring setup fails, still grant Premium and log.
            log.warn("[billing] Pago aprobado pero falló crear la suscripción recurrente: {}", e.getMessage());
            u.setSubscriptionStatus("payment_only");
        }
        u.setPlan("PREMIUM");
        u.setCardBrand(brand);
        u.setCardLast4(last4);
        users.save(u);
    }

    private String friendlyDetail(String detail) {
        return switch (detail) {
            case "cc_rejected_insufficient_amount" -> "Fondos insuficientes en la tarjeta.";
            case "cc_rejected_bad_filled_security_code" -> "Revisa el código de seguridad (CVC).";
            case "cc_rejected_bad_filled_date" -> "Revisa la fecha de vencimiento.";
            case "cc_rejected_bad_filled_card_number" -> "Revisa el número de la tarjeta.";
            case "cc_rejected_call_for_authorize" -> "Debes autorizar este pago con tu banco.";
            case "cc_rejected_card_disabled" -> "La tarjeta está inhabilitada. Contacta a tu banco.";
            case "cc_rejected_high_risk" -> "El pago fue rechazado por seguridad. Prueba con otro medio de pago.";
            default -> "La tarjeta fue rechazada. Prueba con otra.";
        };
    }

    /** Processes a MercadoPago notification by re-fetching the resource (a fake webhook can't forge it). */
    @Transactional
    public void handleWebhook(String type, String id) {
        if (id == null || id.isBlank()) return;
        try {
            String preapprovalId = id;
            if (type != null && type.contains("authorized_payment")) {
                JsonNode pay = mp.getAuthorizedPayment(id);
                preapprovalId = pay.path("preapproval_id").asText(null);
                if (preapprovalId == null) return;
            }
            JsonNode pre = mp.getPreapproval(preapprovalId);
            applySubscription(preapprovalId,
                pre.path("preapproval_plan_id").asText(null),
                pre.path("status").asText(null));
        } catch (RuntimeException e) {
            log.warn("[billing] No se pudo procesar la notificación {} ({}): {}", id, type, e.getMessage());
        }
    }

    /** Enlaza la suscripción al usuario por su plan (preapproval_plan_id) o por el preapproval ya
     *  guardado, y refleja el estado. "authorized" = Premium. */
    private void applySubscription(String preapprovalId, String planId, String status) {
        if (status == null) return;
        User u = null;
        if (planId != null && !planId.isBlank()) {
            u = users.findByMpPreapprovalPlanId(planId).orElse(null);
        }
        if (u == null) u = users.findByMpPreapprovalId(preapprovalId).orElse(null);
        if (u == null) {
            log.warn("[billing] notificación sin usuario (preapproval {}, plan {})", preapprovalId, planId);
            return;
        }
        u.setMpPreapprovalId(preapprovalId);
        u.setSubscriptionStatus(status);
        u.setPlan("authorized".equals(status) ? "PREMIUM" : "FREE");
        users.save(u);
        log.info("[billing] Suscripción {} (plan {}) -> {} (usuario {})", preapprovalId, planId, status, u.getEmail());
    }

    @Transactional
    public void cancel() {
        User u = currentUser.require();
        if (u.getMpPreapprovalId() != null && mp.configured()) {
            try { mp.cancelPreapproval(u.getMpPreapprovalId()); }
            catch (RuntimeException e) { log.warn("[billing] Error al cancelar en MP: {}", e.getMessage()); }
        }
        u.setSubscriptionStatus("cancelled");
        u.setPlan("FREE");
        u.setCardBrand(null);
        u.setCardLast4(null);
        users.save(u);
    }
}
