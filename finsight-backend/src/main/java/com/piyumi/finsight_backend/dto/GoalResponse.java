package com.piyumi.finsight_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalResponse(
        Long id, String name, String emoji,
        BigDecimal targetAmount, BigDecimal savedAmount,
        LocalDate deadline, int progressPercent
) {}