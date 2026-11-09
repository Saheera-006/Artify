package com.artify.service;

import com.artify.exception.ApiException;
import com.fasterxml.jackson.databind.*;
import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {
  private final ObjectMapper mapper;
  private final String key;
  private final List<String> models;
  private final HttpClient client =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

  public GeminiService(
      ObjectMapper mapper,
      @Value("${artify.gemini-api-key}") String key,
      @Value("${artify.gemini-models}") String models) {
    this.mapper = mapper;
    this.key = key;
    this.models =
        Arrays.stream(models.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .distinct()
            .limit(3)
            .toList();
  }

  public JsonNode generate(String prompt, ImageService.ImageData image) {
    if (key.isBlank() || models.isEmpty())
      throw new ApiException(503, "Configure GEMINI_API_KEY and GEMINI_MODELS on the backend.");
    var properties =
        Map.of(
            "name",
            Map.of("type", "STRING"),
            "maxScore",
            Map.of("type", "NUMBER"),
            "score",
            Map.of("type", "NUMBER"),
            "reason",
            Map.of("type", "STRING"));
    var schema =
        Map.of(
            "type",
            "OBJECT",
            "properties",
            Map.of(
                "criteria",
                Map.of(
                    "type",
                    "ARRAY",
                    "items",
                    Map.of(
                        "type",
                        "OBJECT",
                        "properties",
                        properties,
                        "required",
                        List.of("name", "maxScore", "score", "reason"))),
                "totalScore",
                Map.of("type", "NUMBER"),
                "summary",
                Map.of("type", "STRING")),
            "required",
            List.of("criteria", "totalScore", "summary"));
    try {
      String body =
          mapper.writeValueAsString(
              Map.of(
                  "contents",
                      List.of(
                          Map.of(
                              "role",
                              "user",
                              "parts",
                              List.of(
                                  Map.of("text", prompt),
                                  Map.of(
                                      "inlineData",
                                      Map.of(
                                          "data", image.data(), "mimeType", image.mimeType()))))),
                  "generationConfig",
                      Map.of("responseMimeType", "application/json", "responseSchema", schema)));
      ApiException last = new ApiException(502, "AI evaluation failed.");
      for (String model : models) {
        if (!model.matches("[a-zA-Z0-9._-]+"))
          throw new ApiException(503, "Invalid configured Gemini model name.");
        for (int attempt = 0; attempt < 3; attempt++) {
          try {
            HttpRequest request =
                HttpRequest.newBuilder(
                        URI.create(
                            "https://generativelanguage.googleapis.com/v1beta/models/"
                                + model
                                + ":generateContent"))
                    .timeout(Duration.ofSeconds(120))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", key)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) {
              JsonNode root = mapper.readTree(response.body());
              StringBuilder text = new StringBuilder();
              for (JsonNode part : root.path("candidates").path(0).path("content").path("parts")) {
                if (!part.path("thought").asBoolean(false))
                  text.append(part.path("text").asText(""));
              }
              if (text.isEmpty()) throw new ApiException(502, "Gemini returned an empty response.");
              return mapper.readTree(text.toString());
            }
            boolean retryable = Set.of(408, 429, 500, 502, 503, 504).contains(status);
            last =
                new ApiException(
                    status == 429 ? 429 : 502, "Gemini could not evaluate this design.", retryable);
            if (status == 401 || status == 403)
              throw new ApiException(503, "Gemini credentials or permissions need attention.");
            if (!retryable) break;
          } catch (IOException e) {
            last = new ApiException(502, "Gemini is unavailable or returned invalid JSON.", true);
          }
          if (attempt < 2) Thread.sleep(3000L * (1L << attempt));
        }
      }
      throw last;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "Evaluation interrupted.", true);
    } catch (IOException e) {
      throw new ApiException(500, "Unable to prepare evaluation request.");
    }
  }
}
