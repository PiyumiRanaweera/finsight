package com.piyumi.finsight_backend.dto;

import com.piyumi.finsight_backend.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        BigDecimal amount,
        Transaction.Type type,
        String description,
        LocalDate transactionDate,
        Long categoryId,
        String categoryName
) {}