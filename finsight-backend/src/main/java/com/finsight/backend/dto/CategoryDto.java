package com.finsight.backend.dto;

import com.finsight.backend.model.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private Long id;
    private String name;
    private CategoryType type;
    private String colorCode;
    private String iconName;
    private Boolean isCustom;
}
