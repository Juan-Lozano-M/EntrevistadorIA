package com.interviewai.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** Thin transport over the Resend HTTP API. If no API key is configured it logs instead of sending. */
@Component
public class ResendClient {
    private static final Logger log = LoggerFactory.getLogger(ResendClient.class);

    private final RestClient http;
    private final String apiKey;
    private final String from;

    public ResendClient(
            @Value("${app.email.resend.api-key:}") String apiKey,
            @Value("${app.email.resend.from:InterviewAI <onboarding@resend.dev>}") String from) {
        this.http = RestClient.builder().baseUrl("https://api.resend.com").build();
        this.apiKey = apiKey;
        this.from = from;
    }

    /** Returns true if the email was actually dispatched. */
    public boolean send(String to, String subject, String html) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("[email] (sin RESEND_API_KEY) Simulando envío a {} — \"{}\"", to, subject);
            return false;
        }
        try {
            http.post().uri("/emails")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("from", from, "to", to, "subject", subject, "html", html))
                .retrieve()
                .toBodilessEntity();
            log.info("[email] Enviado a {} — \"{}\"", to, subject);
            return true;
        } catch (RestClientException e) {
            log.warn("[email] Error enviando a {}: {}", to, e.getMessage());
            return false;
        }
    }
}
