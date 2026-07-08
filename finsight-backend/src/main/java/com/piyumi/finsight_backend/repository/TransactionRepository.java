package com.piyumi.finsight_backend.repository;

import com.piyumi.finsight_backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserEmailOrderByTransactionDateDesc(String email);
    Optional<Transaction> findByIdAndUserEmail(Long id, String email);
    List<Transaction> findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDesc(
            String email, LocalDate start, LocalDate end);
}