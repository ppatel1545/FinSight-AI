package com.finsight.backend.controller;

import com.finsight.backend.dto.ApiResponse;
import com.finsight.backend.dto.CategoryDto;
import com.finsight.backend.dto.CategoryRequest;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.CategoryService;
import com.finsight.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        List<CategoryDto> categories = categoryService.getCategoriesForUser(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Categories retrieved successfully", categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDto>> createCustomCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        CategoryDto category = categoryService.createCustomCategory(request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Custom category created successfully", category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        categoryService.deleteCustomCategory(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Custom category deleted successfully"));
    }
}
