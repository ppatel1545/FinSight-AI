package com.finsight.backend.service;

import com.finsight.backend.dto.CategoryDto;
import com.finsight.backend.dto.CategoryRequest;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.CategoryType;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private User user;
    private Category systemCategory;
    private Category customCategory;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        systemCategory = new Category("Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false, null);
        systemCategory.setId(10L);

        customCategory = new Category("Streaming", CategoryType.EXPENSE, "#0000FF", "Tv", true, user);
        customCategory.setId(20L);
    }

    @Test
    void testGetCategoriesForUser() {
        when(categoryRepository.findByUserOrIsCustomFalse(user))
                .thenReturn(Arrays.asList(systemCategory, customCategory));

        List<CategoryDto> dtos = categoryService.getCategoriesForUser(user);

        assertNotNull(dtos);
        assertEquals(2, dtos.size());
        assertEquals("Food", dtos.get(0).getName());
        assertFalse(dtos.get(0).getIsCustom());
        assertEquals("Streaming", dtos.get(1).getName());
        assertTrue(dtos.get(1).getIsCustom());
    }

    @Test
    void testCreateCustomCategory_DuplicateExists() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Streaming");
        request.setType(CategoryType.EXPENSE);

        when(categoryRepository.existsByNameAndTypeAndUserOrIsCustomFalse("Streaming", CategoryType.EXPENSE, user))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                categoryService.createCustomCategory(request, user));

        assertEquals("Category with this name and type already exists!", exception.getMessage());
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void testCreateCustomCategory_Success() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Streaming");
        request.setType(CategoryType.EXPENSE);
        request.setColorCode("#0000FF");
        request.setIconName("Tv");

        when(categoryRepository.existsByNameAndTypeAndUserOrIsCustomFalse("Streaming", CategoryType.EXPENSE, user))
                .thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(customCategory);

        CategoryDto result = categoryService.createCustomCategory(request, user);

        assertNotNull(result);
        assertEquals(20L, result.getId());
        assertEquals("Streaming", result.getName());
        assertTrue(result.getIsCustom());

        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void testDeleteCustomCategory_NotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                categoryService.deleteCustomCategory(99L, user));

        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void testDeleteCustomCategory_SystemDefaultBlocked() {
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(systemCategory));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                categoryService.deleteCustomCategory(10L, user));

        assertEquals("You do not have permission to delete this category!", exception.getMessage());
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void testDeleteCustomCategory_ForbiddenForOtherUser() {
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        when(categoryRepository.findById(20L)).thenReturn(Optional.of(customCategory));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                categoryService.deleteCustomCategory(20L, otherUser));

        assertEquals("You do not have permission to delete this category!", exception.getMessage());
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void testDeleteCustomCategory_Success() {
        when(categoryRepository.findById(20L)).thenReturn(Optional.of(customCategory));

        categoryService.deleteCustomCategory(20L, user);

        verify(categoryRepository, times(1)).delete(customCategory);
    }
}
