package com.artify.controller;

import com.artify.service.EvaluationService;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class EvaluationController {
  private final EvaluationService evaluation;

  public EvaluationController(EvaluationService evaluation) {
    this.evaluation = evaluation;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("ok", true, "service", "ARTIFY AI Server");
  }

  @PostMapping("/evaluate-design")
  public Map<String, Object> evaluate(@RequestBody JsonNode request) {
    return evaluation.evaluate(request);
  }
}
