package com.smartpolice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Service
public class OpenRouterClientService {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterClientService.class);

    @Value("${smartpolice.openrouter.api-key:}")
    private String apiKey;

    @Value("${smartpolice.openrouter.model:google/gemini-2.5-flash}")
    private String defaultModel;

    @Value("${smartpolice.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${smartpolice.openrouter.app-title:Smart Police System India}")
    private String appTitle;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient;

    public OpenRouterClientService() {
        this.restClient = RestClient.builder().build();
    }

    /**
     * Send chat completion request to OpenRouter API
     */
    public String chatCompletion(List<Map<String, String>> messages, Double temperature, Integer maxTokens, boolean jsonResponse) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", defaultModel);
            requestBody.put("messages", messages);
            requestBody.put("temperature", temperature != null ? temperature : 0.2);
            if (maxTokens != null) {
                requestBody.put("max_tokens", maxTokens);
            }
            if (jsonResponse) {
                Map<String, String> responseFormat = new HashMap<>();
                responseFormat.put("type", "json_object");
                requestBody.put("response_format", responseFormat);
            }

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            String response = restClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .header("HTTP-Referer", "https://smartpolice.gov.in")
                    .header("X-Title", appTitle)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonPayload)
                    .retrieve()
                    .body(String.class);

            if (response == null || response.isEmpty()) {
                throw new IllegalStateException("Empty response from OpenRouter API");
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                return choices.get(0).path("message").path("content").asText();
            }

            throw new IllegalStateException("Invalid choices in OpenRouter response: " + response);
        } catch (Exception e) {
            log.error("OpenRouter API invocation failed: {}", e.getMessage());
            throw new RuntimeException("AI Intelligence Engine communication failed: " + e.getMessage(), e);
        }
    }

    public String getDefaultModel() {
        return defaultModel;
    }
}
