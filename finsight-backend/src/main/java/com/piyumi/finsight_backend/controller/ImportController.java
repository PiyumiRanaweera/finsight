package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.service.CsvImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final CsvImportService csvImportService;

    @PostMapping("/preview")
    public ResponseEntity<List<Map<String, Object>>> preview(Authentication auth,
                                                             @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(csvImportService.preview(auth.getName(), body.get("csv")));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Integer>> confirm(Authentication auth,
                                                        @RequestBody Map<String, List<Map<String, Object>>> body) {
        int saved = csvImportService.importRows(auth.getName(), body.get("rows"));
        return ResponseEntity.ok(Map.of("imported", saved));
    }
}