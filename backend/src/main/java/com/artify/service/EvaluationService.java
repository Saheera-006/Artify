package com.artify.service;

import com.artify.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class EvaluationService {
  private final ImageService images;
  private final GeminiService gemini;
  private final String rules;

  public record Criterion(String name, BigDecimal maxScore, String description) {}

  public EvaluationService(ImageService images, GeminiService gemini) throws IOException {
    this.images = images;
    this.gemini = gemini;
    this.rules =
        new ClassPathResource("evaluation-rules.txt").getContentAsString(StandardCharsets.UTF_8);
  }

  public List<Criterion> criteria(JsonNode round) {
    List<Criterion> result = new ArrayList<>();
    JsonNode supplied = round.path("criteria");
    if (!supplied.isArray() || supplied.isEmpty() || supplied.size() > 50)
      throw new ApiException(400, "Supply between 1 and 50 evaluation criteria.");
    for (JsonNode item : supplied) {
      String name = item.path("name").asText("").trim();
      try {
        BigDecimal max = new BigDecimal(item.path("maxScore").asText());
        if (!name.isBlank() && max.signum() > 0)
          result.add(new Criterion(name, max, item.path("description").asText("").trim()));
      } catch (NumberFormatException ignored) {
        /* Match the original invalid-criterion filtering. */
      }
    }
    BigDecimal total =
        result.stream().map(Criterion::maxScore).reduce(BigDecimal.ZERO, BigDecimal::add);
    if (total.compareTo(BigDecimal.valueOf(100)) != 0)
      throw new ApiException(400, "AI criteria maximum must total exactly 100.");
    return result;
  }

  public Map<String, Object> normalize(JsonNode evaluation, List<Criterion> criteria) {
    JsonNode values = evaluation == null ? null : evaluation.get("criteria");
    if (values == null || !values.isArray() || values.size() != criteria.size())
      throw new ApiException(502, "Gemini returned an unexpected number of criteria.");
    List<Map<String, Object>> normalized = new ArrayList<>();
    BigDecimal total = BigDecimal.ZERO;
    for (int i = 0; i < criteria.size(); i++) {
      Criterion criterion = criteria.get(i);
      JsonNode item = values.get(i);
      // Match by name rather than silently assigning a shuffled score to the wrong criterion.
      if (!criterion.name().equals(item.path("name").asText()))
        throw new ApiException(502, "Gemini returned criteria in an unexpected order.");
      BigDecimal score;
      try {
        score = new BigDecimal(item.path("score").asText());
      } catch (NumberFormatException e) {
        throw new ApiException(502, "Gemini returned an invalid score.");
      }
      if (score.signum() < 0 || score.compareTo(criterion.maxScore()) > 0)
        throw new ApiException(502, "Gemini returned an out-of-range score.");
      normalized.add(
          Map.of(
              "name",
              criterion.name(),
              "maxScore",
              criterion.maxScore(),
              "score",
              score,
              "reason",
              item.path("reason").asText("No reason provided.").trim()));
      total = total.add(score);
    }
    return Map.of(
        "criteria",
        normalized,
        "rawTotalScore",
        total,
        "maxTotalScore",
        100,
        "totalScore",
        total,
        "summary",
        evaluation.path("summary").asText("").trim());
  }

  public Map<String, Object> evaluate(JsonNode request) {
    JsonNode round = request.path("round");
    String fileUrl = request.path("fileUrl").asText("");
    if (fileUrl.isBlank() || !round.isObject())
      throw new ApiException(400, "fileUrl and round are required.");
    List<Criterion> criteria = criteria(round);
    String url = images.evaluationUrl(fileUrl);
    var image = images.download(url);
    StringBuilder prompt =
        new StringBuilder(
                "You are a strict and objective design competition evaluator.\n"
                    + "Evaluate the submitted ")
            .append(
                "ui".equals(request.path("designType").asText()) ? "UI design" : "poster design")
            .append(" ONLY using the supplied information for THIS round.\n")
            .append("ROUND NAME:\n")
            .append(round.path("name").asText("Not supplied"))
            .append("\nTHEME:\n")
            .append(round.path("theme").asText("Not supplied"))
            .append("\nPROBLEM STATEMENT:\n")
            .append(round.path("problemStatement").asText("Not supplied"))
            .append("\nGUIDELINES:\n");
    for (JsonNode line : round.path("guidelines")) prompt.append(line.asText()).append('\n');
    prompt.append("\nROUND-SPECIFIC REQUIREMENTS:\n");
    for (JsonNode item : round.path("requirements")) {
      String title =
          item.isTextual()
              ? item.asText()
              : item.path("title").asText(item.path("name").asText(""));
      if (!title.isBlank())
        prompt
            .append(title)
            .append(" — ")
            .append(item.path("value").asText(item.path("description").asText("")))
            .append('\n');
    }
    prompt.append("\nSCORING CRITERIA:\n");
    for (Criterion criterion : criteria)
      prompt
          .append(criterion.name())
          .append(" — maximum ")
          .append(criterion.maxScore())
          .append(" points. ")
          .append(criterion.description())
          .append('\n');
    prompt.append('\n').append(rules);
    JsonNode output = gemini.generate(prompt.toString(), image);
    return Map.of(
        "evaluation",
        normalize(output, criteria),
        "sourceType",
        images.isPdf(fileUrl) ? "pdf-converted-to-jpg" : "image",
        "evaluationUrl",
        url);
  }
}
