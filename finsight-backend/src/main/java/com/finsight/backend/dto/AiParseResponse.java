package com.finsight.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiParseResponse {
    private BigDecimal amount;
    private String currency;
    private Long categoryId;
    private String categoryName;
    private String type; // INCOME / EXPENSE
    private String description;
}
