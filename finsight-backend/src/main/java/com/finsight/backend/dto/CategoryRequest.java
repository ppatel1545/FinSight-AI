package com.finsight.backend.dto;

import com.finsight.backend.model.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    @Size(max = 50)
    private String name;

    @NotNull
    private CategoryType type;

    @Size(max = 20)
    private String colorCode;

    @Size(max = 50)
    private String iconName;
}
