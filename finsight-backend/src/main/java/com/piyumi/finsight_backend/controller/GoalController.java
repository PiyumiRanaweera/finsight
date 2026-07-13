package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.dto.GoalRequest;
import com.piyumi.finsight_backend.dto.GoalResponse;
import com.piyumi.finsight_backend.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(goalService.getAll(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(Authentication auth,
                                               @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.create(auth.getName(), request));
    }

    @PostMapping("/{id}/add")
    public ResponseEntity<GoalResponse> addMoney(Authentication auth,
                                                 @PathVariable Long id,
                                                 @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(goalService.addMoney(auth.getName(), id, body.get("amount")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        goalService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}