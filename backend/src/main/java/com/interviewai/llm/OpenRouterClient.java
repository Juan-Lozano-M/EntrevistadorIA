package com.interviewai.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.interviewai.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
public class OpenRouterClient implements LlmClient {
    private final RestClient http;
    private final String apiKey;
    private final String model;

    public OpenRouterClient(
            @Value("${app.llm.openrouter.base-url}") String baseUrl,
            @Value("${app.llm.openrouter.api-key:}") String apiKey,
            @Value("${app.llm.openrouter.model}") String model) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String chat(List<LlmMessage> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                "La IA no está configurada (falta OPENROUTER_API_KEY)");
        }
        Map<String, Object> body = Map.of(
            "model", model,
            "messages", messages.stream()
                .map(m -> Map.of("role", m.role(), "content", m.content()))
                .toList());
        try {
            JsonNode resp = http.post().uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
            return resp == null ? ""
                : resp.path("choices").path(0).path("message").path("content").asText();
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Error al contactar la IA");
        }
    }
}
