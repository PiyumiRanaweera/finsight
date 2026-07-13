package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.dto.TransactionRequest;
import com.piyumi.finsight_backend.dto.TransactionResponse;
import com.piyumi.finsight_backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAll(
            Authentication auth,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(transactionService.getAll(auth.getName(), year, month));
    }

    @GetMapping("/daily-balances")
    public ResponseEntity<List<Map<String, Object>>> dailyBalances(
            Authentication auth,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(transactionService.getDailyBalances(auth.getName(), year, month));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(
            Authentication auth,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(transactionService.getSummary(auth.getName(), year, month));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(Authentication auth,
                                                      @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.create(auth.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(Authentication auth,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.update(auth.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        transactionService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}