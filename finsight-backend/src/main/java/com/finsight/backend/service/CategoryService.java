package com.finsight.backend.service;

import com.finsight.backend.dto.CategoryDto;
import com.finsight.backend.dto.CategoryRequest;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<CategoryDto> getCategoriesForUser(User user) {
        return categoryRepository.findByUserOrIsCustomFalse(user).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCustomCategory(CategoryRequest request, User user) {
        if (categoryRepository.existsByNameAndTypeAndUserOrIsCustomFalse(request.getName(), request.getType(), user)) {
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

        return mapToDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCustomCategory(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (!category.getIsCustom() || category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to delete this category!");
        }

        categoryRepository.delete(category);
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
