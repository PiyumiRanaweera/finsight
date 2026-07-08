package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.dto.CategoryRequest;
import com.piyumi.finsight_backend.dto.CategoryResponse;
import com.piyumi.finsight_backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(categoryService.getAll(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(Authentication auth,
                                                   @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.create(auth.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(Authentication auth,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(auth.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        categoryService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}