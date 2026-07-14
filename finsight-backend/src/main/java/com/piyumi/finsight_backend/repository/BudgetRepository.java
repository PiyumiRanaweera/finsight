package com.piyumi.finsight_backend.repository;

import com.piyumi.finsight_backend.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserEmail(String email);
    Optional<Budget> findByIdAndUserEmail(Long id, String email);
    Optional<Budget> findByCategoryIdAndUserEmail(Long categoryId, String email);
}