package com.piyumi.finsight_backend.repository;

import com.piyumi.finsight_backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserEmail(String email);
    Optional<Category> findByIdAndUserEmail(Long id, String email);
    boolean existsByNameAndUserEmail(String name, String email);
}