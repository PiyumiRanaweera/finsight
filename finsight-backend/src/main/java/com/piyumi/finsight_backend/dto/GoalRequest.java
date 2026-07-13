package com.piyumi.finsight_backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 8) String emoji,
        @NotNull @Positive BigDecimal targetAmount,
        LocalDate deadline
) {}