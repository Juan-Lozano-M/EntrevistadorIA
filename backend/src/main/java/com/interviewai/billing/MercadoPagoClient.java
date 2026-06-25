package com.interviewai.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewai.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;
import java.util.UUID;

/** Thin transport over the MercadoPago REST API (subscriptions / preapproval). */
@Component
public class MercadoPagoClient {
    private static final Logger log = LoggerFactory.getLogger(MercadoPagoClient.class);

    private final RestClient http;
    private final String accessToken;
    private final ObjectMapper objectMapper;

    public MercadoPagoClient(@Value("${app.billing.mercadopago.access-token:}") String accessToken,
                             ObjectMapper objectMapper) {
        this.http = RestClient.builder().baseUrl("https://api.mercadopago.com").build();
        this.accessToken = accessToken;
        this.objectMapper = objectMapper;
    }

    public boolean configured() {
        return accessToken != null && !accessToken.isBlank();
    }

    public JsonNode createPayment(Map<String, Object> body) {
        return exchange("POST", "/v1/payments", body);
    }

    public JsonNode getPayment(String id) {
        return exchange("GET", "/v1/payments/" + id, null);
    }

    public JsonNode searchCustomer(String email) {
        String enc = java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8);
        return exchange("GET", "/v1/customers/search?email=" + enc, null);
    }

    public JsonNode createCustomer(Map<String, Object> body) {
        return exchange("POST", "/v1/customers", body);
    }

    public JsonNode saveCard(String customerId, Map<String, Object> body) {
        return exchange("POST", "/v1/customers/" + customerId + "/cards", body);
    }

    public JsonNode createPreapproval(Map<String, Object> body) {
        return exchange("POST", "/preapproval", body);
    }

    public JsonNode createPreapprovalPlan(Map<String, Object> body) {
        return exchange("POST", "/preapproval_plan", body);
    }

    public JsonNode getPreapproval(String id) {
        return exchange("GET", "/preapproval/" + id, null);
    }

    public JsonNode getAuthorizedPayment(String id) {
        return exchange("GET", "/authorized_payments/" + id, null);
    }

    public JsonNode cancelPreapproval(String id) {
        return exchange("PUT", "/preapproval/" + id, Map.of("status", "cancelled"));
    }

    private JsonNode exchange(String method, String uri, Map<String, Object> body) {
        try {
            if (log.isInfoEnabled()) {
                String bodyStr = "";
                try { bodyStr = body == null ? "(none)" : objectMapper.writeValueAsString(body); }
                catch (Exception ignored) { bodyStr = String.valueOf(body); }
                log.info("[mp] -> {} {} body={}", method, uri, bodyStr);
            }
            RestClient.RequestBodySpec spec = http.method(org.springframework.http.HttpMethod.valueOf(method))
                .uri(uri)
                .header("Authorization", "Bearer " + accessToken)
                .header("X-Idempotency-Key", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON);
            if (body != null) spec.body(body);
            JsonNode resp = spec.retrieve().body(JsonNode.class);
            log.info("[mp] <- {} {} OK resp={}", method, uri, resp);
            return resp;
        } catch (RestClientResponseException e) {
            // MercadoPago returned a 4xx/5xx — log the raw reason, surface a friendly one.
            String mpBody = e.getResponseBodyAsString();
            log.warn("[mp] {} {} -> {} {}", method, uri, e.getStatusCode(), mpBody);
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, friendlyError(mpBody));
        } catch (RestClientException e) {
            log.warn("[mp] {} {} error: {}", method, uri, e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo contactar la pasarela de pago");
        }
    }

    /** Turns a MercadoPago error body into a friendly Spanish message based on its rejection code. */
    private String friendlyError(String body) {
        String code = "", message = "";
        try {
            JsonNode n = objectMapper.readTree(body);
            code = n.path("code").asText("");
            message = n.path("message").asText("");
        } catch (Exception ignored) { /* non-JSON body */ }

        return switch (code) {
            case "cc_rejected_insufficient_amount" -> "Fondos insuficientes en la tarjeta.";
            case "cc_rejected_bad_filled_card_number" -> "Revisa el número de la tarjeta.";
            case "cc_rejected_bad_filled_date" -> "Revisa la fecha de vencimiento.";
            case "cc_rejected_bad_filled_security_code" -> "Revisa el código de seguridad (CVC).";
            case "cc_rejected_bad_filled_other" -> "Revisa los datos de la tarjeta.";
            case "cc_rejected_call_for_authorize" -> "Debes autorizar este pago con tu banco.";
            case "cc_rejected_card_disabled" -> "La tarjeta está inhabilitada. Contacta a tu banco.";
            case "cc_rejected_card_error" -> "No se pudo procesar la tarjeta. Inténtalo de nuevo.";
            case "cc_rejected_duplicated_payment" -> "Ya registramos un pago igual. Espera unos minutos.";
            case "cc_rejected_high_risk" -> "El pago fue rechazado por seguridad. Prueba con otro medio de pago.";
            case "cc_rejected_max_attempts" -> "Alcanzaste el límite de intentos. Prueba con otra tarjeta.";
            case "cc_rejected_blacklist", "cc_rejected_other_reason" -> "La tarjeta fue rechazada. Prueba con otra.";
            default -> code.startsWith("cc_rejected")
                ? "La tarjeta fue rechazada. Prueba con otra."
                : (message.isBlank() ? "No se pudo procesar el pago." : "No se pudo procesar el pago: " + message);
        };
    }
}
