package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.CategoryRequest;
import com.piyumi.finsight_backend.dto.CategoryResponse;
import com.piyumi.finsight_backend.entity.Category;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.CategoryRepository;
import com.piyumi.finsight_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryResponse> getAll(String email) {
        return categoryRepository.findByUserEmail(email).stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName()))
                .toList();
    }

    public CategoryResponse create(String email, CategoryRequest request) {
        if (categoryRepository.existsByNameAndUserEmail(request.name(), email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        Category category = Category.builder()
                .name(request.name())
                .user(user)
                .build();
        categoryRepository.save(category);
        return new CategoryResponse(category.getId(), category.getName());
    }

    public CategoryResponse update(String email, Long id, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        category.setName(request.name());
        categoryRepository.save(category);
        return new CategoryResponse(category.getId(), category.getName());
    }

    public void delete(String email, Long id) {
        Category category = categoryRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        categoryRepository.delete(category);
    }
}