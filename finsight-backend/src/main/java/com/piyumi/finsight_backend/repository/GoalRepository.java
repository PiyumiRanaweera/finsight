package com.piyumi.finsight_backend.repository;

import com.piyumi.finsight_backend.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserEmail(String email);
    Optional<Goal> findByIdAndUserEmail(Long id, String email);
}