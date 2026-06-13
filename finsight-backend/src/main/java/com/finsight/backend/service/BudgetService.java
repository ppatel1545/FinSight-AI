package com.finsight.backend.service;

import com.finsight.backend.dto.BudgetRequest;
import com.finsight.backend.dto.BudgetResponse;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.Budget;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.CategoryType;
import com.finsight.backend.model.Expense;
import com.finsight.backend.model.User;

import com.finsight.backend.repository.BudgetRepository;
import com.finsight.backend.repository.CategoryRepository;
import com.finsight.backend.repository.ExpenseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CurrencyService currencyService;

    @Transactional
    public BudgetResponse saveBudget(BudgetRequest request, User user) {
        log.debug("Processing request to save/upsert budget for user ID: {}, category ID: {}, month: {}", 
                user.getId(), request.getCategoryId(), request.getMonthYear());

        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> {
                    log.warn("Failed to save budget: Category with ID {} not found for user ID: {}", request.getCategoryId(), user.getId());
                    return new ResourceNotFoundException("Category not found with id: " + request.getCategoryId());
                });

        if (category.getType() != CategoryType.EXPENSE) {
            log.warn("Failed to save budget: Category ID {} is of type {}, expected EXPENSE for user ID: {}", 
                    category.getId(), category.getType(), user.getId());
            throw new IllegalArgumentException("Budgets can only be created for EXPENSE categories.");
        }

        Optional<Budget> existingBudgetOpt = budgetRepository.findByUserAndCategoryAndMonthYear(user, category, request.getMonthYear());
        Budget budget;
        if (existingBudgetOpt.isPresent()) {
            budget = existingBudgetOpt.get();
            budget.setLimitAmount(request.getLimitAmount());
            log.debug("Updating existing budget ID {} limit to {} for user ID: {}", budget.getId(), request.getLimitAmount(), user.getId());
        } else {
            budget = new Budget();
            budget.setLimitAmount(request.getLimitAmount());
            budget.setMonthYear(request.getMonthYear());
            budget.setCategory(category);
            budget.setUser(user);
            log.debug("Creating new budget for category ID {} and month {} for user ID: {}", category.getId(), request.getMonthYear(), user.getId());
        }

        Budget saved = budgetRepository.save(budget);
        return mapToResponse(saved);
    }

    @Transactional
    public BudgetResponse updateBudgetLimit(Long id, BigDecimal newLimit, User user) {
        log.debug("Processing request to update budget ID: {} limit to {} for user ID: {}", id, newLimit, user.getId());
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        if (!budget.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden budget update attempt on ID {} by user ID {} (owner is user ID {})", 
                    id, user.getId(), budget.getUser().getId());
            throw new IllegalArgumentException("You do not have permission to update this budget.");
        }

        budget.setLimitAmount(newLimit);
        Budget updated = budgetRepository.save(budget);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(String monthYear, User user) {
        log.debug("Fetching budgets for user ID: {} (monthYear={})", user.getId(), monthYear);
        List<Budget> budgets;
        if (monthYear != null && !monthYear.isBlank()) {
            budgets = budgetRepository.findByUserAndMonthYear(user, monthYear);
        } else {
            budgets = budgetRepository.findByUser(user);
        }

        return budgets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long id, User user) {
        log.debug("Fetching budget ID: {} for user ID: {}", id, user.getId());
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        if (!budget.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden budget access attempt on ID {} by user ID {}", id, user.getId());
            throw new IllegalArgumentException("You do not have permission to view this budget.");
        }

        return mapToResponse(budget);
    }

    @Transactional
    public void deleteBudget(Long id, User user) {
        log.debug("Processing request to delete budget ID: {} for user ID: {}", id, user.getId());
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        if (!budget.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden budget deletion attempt on ID {} by user ID {}", id, user.getId());
            throw new IllegalArgumentException("You do not have permission to delete this budget.");
        }

        budgetRepository.delete(budget);
        log.debug("Budget ID: {} deleted successfully", id);
    }

    public BudgetResponse mapToResponse(Budget budget) {
        YearMonth ym = YearMonth.parse(budget.getMonthYear());
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Expense> expenses = expenseRepository.findByUserAndCategoryAndDateBetween(
                budget.getUser(), budget.getCategory(), start, end);

        BigDecimal spentAmount = expenses.stream()
                .map(e -> currencyService.convert(e.getAmount(), e.getCurrency(), "USD"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingAmount = budget.getLimitAmount().subtract(spentAmount);

        // Determine threshold status:
        // GREEN: spent < 80% of limit
        // AMBER: 80% <= spent <= 100% of limit
        // RED: spent > 100% of limit
        String status = "GREEN";
        BigDecimal limit = budget.getLimitAmount();
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal eightyPercent = limit.multiply(new BigDecimal("0.8"));
            if (spentAmount.compareTo(limit) > 0) {
                status = "RED";
            } else if (spentAmount.compareTo(eightyPercent) >= 0) {
                status = "AMBER";
            }
        } else {
            // Edge case: if limit is 0, any spending is RED, else GREEN
            if (spentAmount.compareTo(BigDecimal.ZERO) > 0) {
                status = "RED";
            }
        }

        return new BudgetResponse(
                budget.getId(),
                budget.getLimitAmount(),
                budget.getMonthYear(),
                categoryService.mapToDto(budget.getCategory()),
                spentAmount,
                remainingAmount,
                status,
                budget.getCreatedAt()
        );
    }
}
