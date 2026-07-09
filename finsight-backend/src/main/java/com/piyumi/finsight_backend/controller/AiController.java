package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/suggest-category")
    public ResponseEntity<Map<String, String>> suggestCategory(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String suggestion = aiService.suggestCategory(auth.getName(), body.get("description"));
        return ResponseEntity.ok(Map.of("category", suggestion != null ? suggestion : ""));
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, String>> insights(
            Authentication auth,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(Map.of("insights", aiService.monthlyInsights(auth.getName(), year, month)));
    }
}