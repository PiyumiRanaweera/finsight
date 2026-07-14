package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(Authentication auth) {
        return ResponseEntity.ok(budgetService.getAllWithProgress(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<Void> upsert(Authentication auth,
                                       @RequestBody Map<String, Object> body) {
        budgetService.upsert(auth.getName(),
                Long.valueOf(body.get("categoryId").toString()),
                new BigDecimal(body.get("monthlyLimit").toString()));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        budgetService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}