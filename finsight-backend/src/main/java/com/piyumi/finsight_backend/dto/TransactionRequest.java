package com.piyumi.finsight_backend.dto;

import com.piyumi.finsight_backend.entity.Transaction;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull @Positive BigDecimal amount,
        @NotNull Transaction.Type type,
        @NotBlank @Size(max = 255) String description,
        @NotNull LocalDate transactionDate,
        Long categoryId // optional
) {}