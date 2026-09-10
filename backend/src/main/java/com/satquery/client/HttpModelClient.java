package com.satquery.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HttpModelClient implements ModelClient {
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public HttpModelClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("task", taskType.toString());
            requestBody.put("query", request.getQueryText());
            
            List<String> paths = new ArrayList<>();
            for (ImageAsset img : images) {
                paths.add(img.getFilePath());
            }
            requestBody.put("images", paths);

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            String path = switch(taskType) {
                case VQA, CAPTIONING, INFORMATION_EXTRACTION -> "/api/query";
                case GROUNDING -> "/api/roi/analyze";
                case CHANGE_ANALYSIS, CHANGE_UNDERSTANDING -> "/api/change-detection";
                case FUSION_ANALYSIS -> "/api/multimodal-query";
                default -> "/api/query";
            };

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .header("Content-Type", "application/json")
                    .header("X-SatQuery-Api-Key", "satquery-vlm-key-2026-sih")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(60))
                    .build();


            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 404) {
                throw new RuntimeException("TASK_NOT_SUPPORTED: The model endpoint does not support this task type.");
            } else if (response.statusCode() != 200) {
                throw new RuntimeException("MODEL_RESPONSE_INVALID: Model returned status code " + response.statusCode());
            }

            try {
                return objectMapper.readValue(response.body(), ModelResponse.class);
            } catch (Exception e) {
                throw new RuntimeException("MODEL_RESPONSE_INVALID: Response payload is not valid JSON.");
            }

        } catch (java.net.http.HttpTimeoutException e) {
            throw new RuntimeException("MODEL_TIMEOUT: The remote AI model timed out. Please retry or fallback to mock models.");
        } catch (java.io.IOException e) {
            throw new RuntimeException("MODEL_UNAVAILABLE: Remote AI model server is offline or unreachable.");
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }
}
