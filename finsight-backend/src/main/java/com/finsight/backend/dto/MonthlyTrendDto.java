package com.finsight.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendDto {
    private String monthYear; // YYYY-MM
    private BigDecimal income;
    private BigDecimal expense;
    private BigDecimal savings;
}
