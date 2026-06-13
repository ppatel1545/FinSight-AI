package com.finsight.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private BigDecimal limitAmount;
    private String monthYear;
    private CategoryDto category;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private String thresholdStatus; // GREEN, AMBER, RED
    private LocalDateTime createdAt;
}
