package com.finsight.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {
    @NotNull(message = "Limit amount is required")
    @Positive(message = "Limit amount must be positive")
    private BigDecimal limitAmount;

    @NotBlank(message = "Month-Year is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Month-Year must be in YYYY-MM format")
    private String monthYear;

    @NotNull(message = "Category ID is required")
    private Long categoryId;
}
