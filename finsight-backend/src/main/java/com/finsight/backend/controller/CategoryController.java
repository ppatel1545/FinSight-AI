package com.finsight.backend.controller;

import com.finsight.backend.dto.ApiResponse;
import com.finsight.backend.dto.CategoryDto;
import com.finsight.backend.dto.CategoryRequest;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.CategoryService;
import com.finsight.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to retrieve categories for user ID: {}", userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        List<CategoryDto> categories = categoryService.getCategoriesForUser(user);
        log.debug("Successfully retrieved {} categories for user ID: {}", categories.size(), userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Categories retrieved successfully", categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDto>> createCustomCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to create custom category: name={}, type={} for user ID: {}", 
                request.getName(), request.getType(), userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        CategoryDto category = categoryService.createCustomCategory(request, user);
        log.info("Custom category created successfully: id={}, name={} for user ID: {}", 
                category.getId(), category.getName(), userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Custom category created successfully", category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to delete custom category: id={} for user ID: {}", id, userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        categoryService.deleteCustomCategory(id, user);
        log.info("Custom category deleted successfully: id={} for user ID: {}", id, userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Custom category deleted successfully"));
    }
}
