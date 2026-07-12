package com.piyumi.finsight_backend.exception;

import com.piyumi.finsight_backend.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1. Errors we throw ourselves (404, 409, 401...)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return ResponseEntity.status(status)
                .body(ErrorResponse.of(status.value(), status.name(), ex.getReason()));
    }

    // 2. Bean validation failures (@NotBlank, @Email, @Size on DTOs)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fieldErrors.put(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(ErrorResponse.validation("Request validation failed", fieldErrors));
    }

    // 3. Wrong parameter types (?year=abc)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "INVALID_PARAMETER",
                        "Invalid value for parameter '" + ex.getName() + "'"));
    }

    // 4. Gemini rate limit (the 429 you've met personally!)
    @ExceptionHandler(HttpClientErrorException.TooManyRequests.class)
    public ResponseEntity<ErrorResponse> handleAiRateLimit(HttpClientErrorException.TooManyRequests ex) {
        log.warn("AI provider rate limit hit");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.of(503, "AI_UNAVAILABLE",
                        "The AI service is busy right now. Please try again in a moment."));
    }

    // 5. Any other AI provider failure (network, bad key, etc.)
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ErrorResponse> handleAiFailure(RestClientException ex) {
        log.error("AI provider call failed", ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.of(503, "AI_UNAVAILABLE",
                        "The AI service is currently unavailable. Please try again later."));
    }

    // 6. Safety net — anything we didn't anticipate
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.of(500, "INTERNAL_ERROR",
                        "Something went wrong on our side."));
    }

    // Malformed or missing request body
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "MALFORMED_REQUEST",
                        "Request body is missing or not valid JSON"));
    }
}