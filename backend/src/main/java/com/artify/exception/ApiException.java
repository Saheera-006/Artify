package com.artify.exception;

public class ApiException extends RuntimeException {
  public final int status;
  public final boolean retryable;

  public ApiException(int status, String message) {
    this(status, message, false);
  }

  public ApiException(int status, String message, boolean retryable) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}
