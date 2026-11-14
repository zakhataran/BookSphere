package org.project.service.impl;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.extern.slf4j.Slf4j;
import org.project.database.entity.Book;
import org.project.exceptions.AiServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

@Slf4j
@Component
public class GeminiEmbeddingClient {

    private final RestClient restClient;
    private final String path;
    private final String model;

    public GeminiEmbeddingClient(
            @Value("${spring.ai.openai.base-url}") String baseUrl,
            @Value("${spring.ai.openai.api-key}") String apiKey,
            @Value("${spring.ai.openai.embedding.embeddings-path}") String path,
            @Value("${spring.ai.openai.embedding.options.model}") String model) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
        this.path = path;
        this.model = model;
    }

    public float[] embed(String text) {
        JsonNode response;
        try {
            response = restClient.post()
                    .uri(path)
                    .body(Map.of(
                            "model", model,
                            "input", text,
                            "dimensions", Book.EMBEDDING_DIMENSION))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.warn("Embedding provider returned status {}", e.getStatusCode());
            throw new AiServiceException("Embedding service is temporarily unavailable");
        } catch (RestClientException e) {
            log.warn("Embedding request failed: {}", e.getClass().getSimpleName());
            throw new AiServiceException("Embedding service is temporarily unavailable");
        }

        JsonNode values = response == null ? null : response.path("data").path(0).path("embedding");
        if (values == null || !values.isArray() || values.isEmpty()) {
            throw new AiServiceException("Embedding service returned an empty response");
        }

        float[] vector = new float[values.size()];
        for (int i = 0; i < vector.length; i++) {
            vector[i] = (float) values.get(i).asDouble();
        }

        if (vector.length > Book.EMBEDDING_DIMENSION) {
            vector = truncateNoralize(vector, Book.EMBEDDING_DIMENSION);
        }

        return vector;
    }

    private static float[] truncateNoralize(float[] vector, int dimension) {
        float[] out = Arrays.copyOf(vector, dimension);
        double norm = 0;
        for (float v : out) {
            norm += v * v;
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < out.length; i++) {
                out[i] /= (float) norm;
            }
        }

        return out;
    }
}