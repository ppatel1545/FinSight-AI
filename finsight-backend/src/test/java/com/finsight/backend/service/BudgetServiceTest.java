package com.finsight.backend.service;

import com.finsight.backend.dto.BudgetRequest;
import com.finsight.backend.dto.BudgetResponse;
import com.finsight.backend.dto.CategoryDto;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.*;
import com.finsight.backend.repository.BudgetRepository;
import com.finsight.backend.repository.CategoryRepository;
import com.finsight.backend.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CategoryService categoryService;

    @Mock
    private CurrencyService currencyService;

    @InjectMocks
    private BudgetService budgetService;

    private User user;
    private Category expenseCategory;
    private Category incomeCategory;
    private Budget budget;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        expenseCategory = new Category("Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false, null);
        expenseCategory.setId(10L);

        incomeCategory = new Category("Salary", CategoryType.INCOME, "#00FF00", "Briefcase", false, null);
        incomeCategory.setId(11L);

        budget = new Budget();
        budget.setId(100L);
        budget.setUser(user);
        budget.setCategory(expenseCategory);
        budget.setLimitAmount(new BigDecimal("500.00"));
        budget.setMonthYear("2026-06");
        budget.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testSaveBudget_CategoryNotFound() {
        BudgetRequest request = new BudgetRequest();
        request.setCategoryId(99L);
        request.setMonthYear("2026-06");
        request.setLimitAmount(new BigDecimal("100.00"));

        when(categoryRepository.findByIdAndUserOrIsCustomFalse(99L, user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                budgetService.saveBudget(request, user));

        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void testSaveBudget_CategoryNotExpense() {
        BudgetRequest request = new BudgetRequest();
        request.setCategoryId(11L);
        request.setMonthYear("2026-06");
        request.setLimitAmount(new BigDecimal("100.00"));

        when(categoryRepository.findByIdAndUserOrIsCustomFalse(11L, user)).thenReturn(Optional.of(incomeCategory));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                budgetService.saveBudget(request, user));

        assertEquals("Budgets can only be created for EXPENSE categories.", exception.getMessage());
        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void testSaveBudget_CreateNew() {
        BudgetRequest request = new BudgetRequest();
        request.setCategoryId(10L);
        request.setMonthYear("2026-06");
        request.setLimitAmount(new BigDecimal("500.00"));

        when(categoryRepository.findByIdAndUserOrIsCustomFalse(10L, user)).thenReturn(Optional.of(expenseCategory));
        when(budgetRepository.findByUserAndCategoryAndMonthYear(user, expenseCategory, "2026-06"))
                .thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // For mapToResponse mapping stub
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));
        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        BudgetResponse response = budgetService.saveBudget(request, user);

        assertNotNull(response);
        assertEquals(new BigDecimal("500.00"), response.getLimitAmount());
        assertEquals("2026-06", response.getMonthYear());
        assertEquals("Food", response.getCategory().getName());
        verify(budgetRepository, times(1)).save(any(Budget.class));
    }

    @Test
    void testSaveBudget_UpdateExisting() {
        BudgetRequest request = new BudgetRequest();
        request.setCategoryId(10L);
        request.setMonthYear("2026-06");
        request.setLimitAmount(new BigDecimal("600.00"));

        when(categoryRepository.findByIdAndUserOrIsCustomFalse(10L, user)).thenReturn(Optional.of(expenseCategory));
        when(budgetRepository.findByUserAndCategoryAndMonthYear(user, expenseCategory, "2026-06"))
                .thenReturn(Optional.of(budget));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // For mapping
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));
        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        BudgetResponse response = budgetService.saveBudget(request, user);

        assertNotNull(response);
        assertEquals(new BigDecimal("600.00"), response.getLimitAmount()); // Updated
        verify(budgetRepository, times(1)).save(budget);
    }

    @Test
    void testUpdateBudgetLimit_NotFound() {
        when(budgetRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                budgetService.updateBudgetLimit(999L, new BigDecimal("100.00"), user));
    }

    @Test
    void testUpdateBudgetLimit_Forbidden() {
        User otherUser = new User();
        otherUser.setId(2L);

        when(budgetRepository.findById(100L)).thenReturn(Optional.of(budget));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                budgetService.updateBudgetLimit(100L, new BigDecimal("600.00"), otherUser));

        assertEquals("You do not have permission to update this budget.", exception.getMessage());
    }

    @Test
    void testUpdateBudgetLimit_Success() {
        when(budgetRepository.findById(100L)).thenReturn(Optional.of(budget));
        when(budgetRepository.save(budget)).thenReturn(budget);

        // For mapping
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));
        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        BudgetResponse response = budgetService.updateBudgetLimit(100L, new BigDecimal("600.00"), user);

        assertNotNull(response);
        assertEquals(new BigDecimal("600.00"), response.getLimitAmount());
        verify(budgetRepository, times(1)).save(budget);
    }

    @Test
    void testGetBudgets_WithMonthYear() {
        when(budgetRepository.findByUserAndMonthYear(user, "2026-06"))
                .thenReturn(Collections.singletonList(budget));

        // For mapping
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));

        List<BudgetResponse> results = budgetService.getBudgets("2026-06", user);

        assertEquals(1, results.size());
        assertEquals("2026-06", results.get(0).getMonthYear());
    }

    @Test
    void testGetBudgetById_Forbidden() {
        User otherUser = new User();
        otherUser.setId(2L);

        when(budgetRepository.findById(100L)).thenReturn(Optional.of(budget));

        assertThrows(IllegalArgumentException.class, () ->
                budgetService.getBudgetById(100L, otherUser));
    }

    @Test
    void testDeleteBudget_Success() {
        when(budgetRepository.findById(100L)).thenReturn(Optional.of(budget));

        budgetService.deleteBudget(100L, user);

        verify(budgetRepository, times(1)).delete(budget);
    }

    @Test
    void testMapToResponse_StatusGreen() {
        // limit = 500, spent = 300 (which is < 80% of 500 = 400) -> GREEN
        Expense exp1 = new Expense();
        exp1.setAmount(new BigDecimal("150.00"));
        exp1.setCurrency("USD");

        Expense exp2 = new Expense();
        exp2.setAmount(new BigDecimal("150.00"));
        exp2.setCurrency("USD");

        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(exp1, exp2));
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));
        when(currencyService.convert(any(BigDecimal.class), anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(0));

        BudgetResponse response = budgetService.mapToResponse(budget);

        assertEquals("GREEN", response.getThresholdStatus());
        assertEquals(new BigDecimal("300.00"), response.getSpentAmount());
        assertEquals(new BigDecimal("200.00"), response.getRemainingAmount());
    }

    @Test
    void testMapToResponse_StatusAmber() {
        // limit = 500, spent = 410 (which is >= 80% of 500 = 400, and <= 500) -> AMBER
        Expense exp = new Expense();
        exp.setAmount(new BigDecimal("410.00"));
        exp.setCurrency("USD");

        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(exp));
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));
        when(currencyService.convert(any(BigDecimal.class), anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(0));

        BudgetResponse response = budgetService.mapToResponse(budget);

        assertEquals("AMBER", response.getThresholdStatus());
        assertEquals(new BigDecimal("410.00"), response.getSpentAmount());
        assertEquals(new BigDecimal("90.00"), response.getRemainingAmount());
    }

    @Test
    void testMapToResponse_StatusRed() {
        // limit = 500, spent = 510 (which is > 500) -> RED
        Expense exp = new Expense();
        exp.setAmount(new BigDecimal("510.00"));
        exp.setCurrency("USD");

        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(exp));
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));
        when(currencyService.convert(any(BigDecimal.class), anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(0));

        BudgetResponse response = budgetService.mapToResponse(budget);

        assertEquals("RED", response.getThresholdStatus());
        assertEquals(new BigDecimal("510.00"), response.getSpentAmount());
        assertEquals(new BigDecimal("-10.00"), response.getRemainingAmount());
    }

    @Test
    void testMapToResponse_ZeroLimitEdgeCases() {
        budget.setLimitAmount(BigDecimal.ZERO);

        // limit = 0, spent = 0 -> GREEN
        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));

        BudgetResponse resZeroSpent = budgetService.mapToResponse(budget);
        assertEquals("GREEN", resZeroSpent.getThresholdStatus());

        // limit = 0, spent = 1 -> RED
        Expense exp = new Expense();
        exp.setAmount(BigDecimal.ONE);
        exp.setCurrency("USD");
        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(exp));
        when(currencyService.convert(any(BigDecimal.class), anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(0));

        BudgetResponse resSomeSpent = budgetService.mapToResponse(budget);
        assertEquals("RED", resSomeSpent.getThresholdStatus());
    }

    @Test
    void testMapToResponse_MultiCurrencyConversion() {
        // limit = 500. Spent: 100 EUR, 8300 INR
        // 100 EUR should convert to 108.69 USD (using rates, or let's mock currencyService returning mock converted amounts)
        Expense exp1 = new Expense();
        exp1.setAmount(new BigDecimal("100.00"));
        exp1.setCurrency("EUR");

        Expense exp2 = new Expense();
        exp2.setAmount(new BigDecimal("8300.00"));
        exp2.setCurrency("INR");

        when(expenseRepository.findByUserAndCategoryAndDateBetween(eq(user), eq(expenseCategory), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(exp1, exp2));
        when(categoryService.mapToDto(expenseCategory))
                .thenReturn(new CategoryDto(10L, "Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false));

        // Mock currencyService conversion:
        // 100.00 EUR -> 108.70 USD
        // 8300.00 INR -> 100.00 USD
        when(currencyService.convert(new BigDecimal("100.00"), "EUR", "USD")).thenReturn(new BigDecimal("108.70"));
        when(currencyService.convert(new BigDecimal("8300.00"), "INR", "USD")).thenReturn(new BigDecimal("100.00"));

        BudgetResponse response = budgetService.mapToResponse(budget);

        assertEquals("GREEN", response.getThresholdStatus()); // 208.70 < 400 (80%)
        assertEquals(new BigDecimal("208.70"), response.getSpentAmount());
        assertEquals(new BigDecimal("291.30"), response.getRemainingAmount());
    }
}
