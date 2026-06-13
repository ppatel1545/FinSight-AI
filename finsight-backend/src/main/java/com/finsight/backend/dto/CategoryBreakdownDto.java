package com.finsight.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryBreakdownDto {
    private Long categoryId;
    private String categoryName;
    private String colorCode;
    private String iconName;
    private BigDecimal totalSpent;
    private Double percentage;
}
