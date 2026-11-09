package com.artify.exception;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> known(ApiException e) {
    return ResponseEntity.status(e.status)
        .body(Map.of("error", e.getMessage(), "retryable", e.retryable, "status", e.status));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<?> malformed() {
    return ResponseEntity.badRequest().body(Map.of("error", "Request must contain valid JSON."));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e) {
    log.error("Evaluation failed: {}", e.getClass().getSimpleName());
    return ResponseEntity.internalServerError()
        .body(Map.of("error", "AI evaluation failed.", "retryable", false, "status", 500));
  }
}
