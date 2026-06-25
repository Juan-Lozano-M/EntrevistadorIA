package com.interviewai.billing;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {
    private final BillingService billing;
    public BillingController(BillingService billing) { this.billing = billing; }

    @GetMapping("/config")
    public Map<String, Object> config() {
        return billing.publicConfig();
    }

    @PostMapping("/prepare-card")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, Object> prepareCard(@RequestBody PrepareCardRequest req) {
        return billing.prepareCard(req.cardToken());
    }

    @PostMapping("/subscribe")
    @SecurityRequirement(name = "bearerAuth")
    public BillingService.SubscribeResult subscribe(@RequestBody SubscribeRequest req) {
        return billing.subscribe(req);
    }

    @PostMapping("/confirm")
    @SecurityRequirement(name = "bearerAuth")
    public BillingService.SubscribeResult confirm(@RequestBody ConfirmRequest req) {
        return billing.confirm(req);
    }

    @PostMapping("/test-payment")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, Object> testPayment(@RequestBody SubscribeRequest req) {
        return billing.testPayment(req);
    }

    @PostMapping("/cancel")
    @SecurityRequirement(name = "bearerAuth")
    public void cancel() {
        billing.cancel();
    }

    /** MercadoPago both VALIDATES this back_url (server-side) and redirects the browser here after
     *  payment. A 302 to a localhost SPA makes MP's validation fail (500), so return a 200 HTML page
     *  that redirects the real browser via JS instead. */
    @GetMapping(value = "/return", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> paymentReturn() {
        String url = billing.spaReturnUrl();
        String safe = url.replace("\"", "%22").replace("<", "%3C").replace(">", "%3E");
        String html = "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
            + "<title>Redirigiendo…</title></head>"
            + "<body style=\"font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0\">"
            + "<p>Procesando tu suscripción… <a href=\"" + safe + "\">Continuar</a></p>"
            + "<script>location.replace(\"" + safe + "\");</script></body></html>";
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    /** Public webhook hit by MercadoPago. Accepts the id/type from query or body and always 200s fast. */
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "topic", required = false) String topic,
            @RequestParam(name = "id", required = false) String id,
            @RequestParam(name = "data.id", required = false) String dataId,
            @RequestBody(required = false) JsonNode body) {
        String t = type != null ? type : topic;
        String resourceId = dataId != null ? dataId : id;
        if (body != null) {
            if (t == null) t = text(body.path("type"), text(body.path("topic"), null));
            if (resourceId == null) resourceId = text(body.path("data").path("id"), text(body.path("id"), null));
        }
        billing.handleWebhook(t, resourceId);
        return ResponseEntity.ok().build();
    }

    private String text(JsonNode node, String fallback) {
        return node != null && !node.isMissingNode() && !node.isNull() ? node.asText() : fallback;
    }
}
