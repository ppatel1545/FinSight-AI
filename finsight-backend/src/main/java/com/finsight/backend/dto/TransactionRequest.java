package com.finsight.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionRequest {
    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private LocalDate date;

    @Size(max = 255)
    private String description;

    @NotNull
    private Long categoryId;
}
