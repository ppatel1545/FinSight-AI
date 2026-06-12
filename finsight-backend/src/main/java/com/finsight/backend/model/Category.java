package com.finsight.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;

    @Column(name = "color_code", length = 20)
    private String colorCode;

    @Column(name = "icon_name", length = 50)
    private String iconName;

    @Column(name = "is_custom", nullable = false)
    private Boolean isCustom = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public Category(String name, CategoryType type, String colorCode, String iconName, Boolean isCustom, User user) {
        this.name = name;
        this.type = type;
        this.colorCode = colorCode;
        this.iconName = iconName;
        this.isCustom = isCustom;
        this.user = user;
    }
}
