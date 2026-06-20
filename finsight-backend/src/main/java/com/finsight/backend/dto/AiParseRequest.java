package com.finsight.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiParseRequest {
    @NotBlank(message = "Text to parse cannot be blank")
    private String text;
}
