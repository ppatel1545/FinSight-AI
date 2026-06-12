package com.finsight.backend.dto;

import com.finsight.backend.model.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private BigDecimal amount;
    private LocalDate date;
    private String description;
    private String currency;
    private CategoryType type;
    private CategoryDto category;
    private LocalDateTime createdAt;
}
