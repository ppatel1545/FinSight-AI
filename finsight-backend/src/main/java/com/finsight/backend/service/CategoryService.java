package com.finsight.backend.service;

import com.finsight.backend.dto.CategoryDto;
import com.finsight.backend.dto.CategoryRequest;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<CategoryDto> getCategoriesForUser(User user) {
        log.debug("Fetching categories for user ID: {} ({})", user.getId(), user.getUsername());
        List<CategoryDto> result = categoryRepository.findByUserOrIsCustomFalse(user).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        log.debug("Found {} categories for user ID: {}", result.size(), user.getId());
        return result;
    }

    @Transactional
    public CategoryDto createCustomCategory(CategoryRequest request, User user) {
        log.debug("Attempting to create custom category: name={}, type={} for user ID: {}", 
                request.getName(), request.getType(), user.getId());
        if (categoryRepository.existsByNameAndTypeAndUserOrIsCustomFalse(request.getName(), request.getType(), user)) {
            log.warn("Category validation failed: category with name '{}' and type '{}' already exists for user ID: {}", 
                    request.getName(), request.getType(), user.getId());
            throw new IllegalArgumentException("Category with this name and type already exists!");
        }

        Category category = new Category(
                request.getName(),
                request.getType(),
                request.getColorCode(),
                request.getIconName(),
                true,
                user
        );

        Category saved = categoryRepository.save(category);
        log.debug("Custom category saved successfully with ID: {} for user ID: {}", saved.getId(), user.getId());
        return mapToDto(saved);
    }

    @Transactional
    public void deleteCustomCategory(Long id, User user) {
        log.debug("Attempting to delete custom category ID: {} for user ID: {}", id, user.getId());
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Category deletion failed: category with ID {} not found", id);
                    return new ResourceNotFoundException("Category not found with id: " + id);
                });

        if (!category.getIsCustom() || category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
            log.warn("Category deletion forbidden: user ID {} does not own category ID {} or it is not custom", user.getId(), id);
            throw new IllegalArgumentException("You do not have permission to delete this category!");
        }

        categoryRepository.delete(category);
        log.debug("Custom category ID: {} deleted successfully for user ID: {}", id, user.getId());
    }

    public CategoryDto mapToDto(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getType(),
                category.getColorCode(),
                category.getIconName(),
                category.getIsCustom()
        );
    }
}
