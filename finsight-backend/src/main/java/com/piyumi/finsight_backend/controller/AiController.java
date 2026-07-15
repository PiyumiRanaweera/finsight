package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

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

    @PostMapping("/scan-receipt")
    public ResponseEntity<Map<String, Object>> scanReceipt(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(aiService.scanReceipt(
                auth.getName(), body.get("image"), body.get("mimeType")));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(Authentication auth,
                                                    @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("history");
        String answer = aiService.chat(auth.getName(), body.get("question").toString(), history);
        return ResponseEntity.ok(Map.of("answer", answer));
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, String>> insights(
            Authentication auth,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(Map.of("insights", aiService.monthlyInsights(auth.getName(), year, month)));
    }
}