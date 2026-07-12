package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.CategoryRequest;
import com.piyumi.finsight_backend.dto.CategoryResponse;
import com.piyumi.finsight_backend.entity.Category;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.CategoryRepository;
import com.piyumi.finsight_backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void create_savesCategoryForUser() {
        when(categoryRepository.existsByNameAndUserEmail("Food", "piyumi@test.com")).thenReturn(false);
        when(userRepository.findByEmail("piyumi@test.com"))
                .thenReturn(Optional.of(User.builder().email("piyumi@test.com").build()));

        CategoryResponse response = categoryService.create("piyumi@test.com", new CategoryRequest("Food"));

        assertThat(response.name()).isEqualTo("Food");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void create_rejectsDuplicateName() {
        // TODO: you write this one!
        // Arrange: mock existsByNameAndUserEmail to return true
        // Act + Assert: assertThatThrownBy ... ResponseStatusException, message "Category already exists"
        // Bonus: verify save is never called
    }

    @Test
    void delete_removesOwnCategory() {
        var category = Category.builder().id(1L).name("Food").build();
        when(categoryRepository.findByIdAndUserEmail(1L, "piyumi@test.com"))
                .thenReturn(Optional.of(category));

        categoryService.delete("piyumi@test.com", 1L);

        verify(categoryRepository).delete(category);
    }

    @Test
    void delete_throwsNotFoundForOtherUsersCategory() {
        // TODO: you write this one!
        // Arrange: findByIdAndUserEmail returns Optional.empty()
        // Act + Assert: expect ResponseStatusException with "Category not found"
        // (This test PROVES your IDOR protection — user A can't delete user B's data)
    }
}