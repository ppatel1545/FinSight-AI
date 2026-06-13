package com.finsight.backend.service;

import com.finsight.backend.dto.*;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.*;
import com.finsight.backend.repository.CategoryRepository;
import com.finsight.backend.repository.ExpenseRepository;
import com.finsight.backend.repository.IncomeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
public class TransactionService {

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CurrencyService currencyService;

    @Transactional
    public TransactionResponse createIncome(TransactionRequest request, User user) {
        log.debug("Processing request to create income for user ID: {}, category ID: {}", user.getId(), request.getCategoryId());
        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> {
                    log.warn("Failed to create income: Category with ID {} not found for user ID: {}", request.getCategoryId(), user.getId());
                    return new ResourceNotFoundException("Category not found with id: " + request.getCategoryId());
                });

        if (category.getType() != CategoryType.INCOME) {
            log.warn("Failed to create income: Category ID {} type is {}, expected INCOME for user ID: {}", 
                    category.getId(), category.getType(), user.getId());
            throw new IllegalArgumentException("Cannot associate an INCOME transaction with an EXPENSE category.");
        }

        Income income = new Income();
        income.setAmount(request.getAmount());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription());
        income.setCurrency(request.getCurrency());
        income.setCategory(category);
        income.setUser(user);

        Income savedIncome = incomeRepository.save(income);
        log.debug("Income transaction saved successfully with ID: {} for user ID: {}", savedIncome.getId(), user.getId());
        return mapToDto(savedIncome);
    }

    @Transactional
    public TransactionResponse updateIncome(Long id, TransactionRequest request, User user) {
        log.debug("Processing request to update income ID: {} for user ID: {}", id, user.getId());
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Failed to update income: Income transaction ID {} not found", id);
                    return new ResourceNotFoundException("Income not found with id: " + id);
                });

        if (!income.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden update attempt on income ID {} by user ID {} (owner is user ID {})", 
                    id, user.getId(), income.getUser().getId());
            throw new IllegalArgumentException("You do not have permission to update this transaction.");
        }

        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> {
                    log.warn("Failed to update income ID {}: Category ID {} not found for user ID: {}", 
                            id, request.getCategoryId(), user.getId());
                    return new ResourceNotFoundException("Category not found with id: " + request.getCategoryId());
                });

        if (category.getType() != CategoryType.INCOME) {
            log.warn("Failed to update income ID {}: Category ID {} type is {}, expected INCOME for user ID: {}", 
                    id, category.getId(), category.getType(), user.getId());
            throw new IllegalArgumentException("Cannot associate an INCOME transaction with an EXPENSE category.");
        }

        income.setAmount(request.getAmount());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription());
        income.setCurrency(request.getCurrency());
        income.setCategory(category);

        Income updatedIncome = incomeRepository.save(income);
        log.debug("Income transaction ID: {} updated successfully for user ID: {}", updatedIncome.getId(), user.getId());
        return mapToDto(updatedIncome);
    }

    @Transactional
    public void deleteIncome(Long id, User user) {
        log.debug("Processing request to delete income ID: {} for user ID: {}", id, user.getId());
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Failed to delete income: Income transaction ID {} not found", id);
                    return new ResourceNotFoundException("Income not found with id: " + id);
                });

        if (!income.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden deletion attempt on income ID {} by user ID {} (owner is user ID {})", 
                    id, user.getId(), income.getUser().getId());
            throw new IllegalArgumentException("You do not have permission to delete this transaction.");
        }

        incomeRepository.delete(income);
        log.debug("Income transaction ID: {} deleted successfully for user ID: {}", id, user.getId());
    }

    @Transactional
    public TransactionResponse createExpense(TransactionRequest request, User user) {
        log.debug("Processing request to create expense for user ID: {}, category ID: {}", user.getId(), request.getCategoryId());
        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> {
                    log.warn("Failed to create expense: Category with ID {} not found for user ID: {}", request.getCategoryId(), user.getId());
                    return new ResourceNotFoundException("Category not found with id: " + request.getCategoryId());
                });

        if (category.getType() != CategoryType.EXPENSE) {
            log.warn("Failed to create expense: Category ID {} type is {}, expected EXPENSE for user ID: {}", 
                    category.getId(), category.getType(), user.getId());
            throw new IllegalArgumentException("Cannot associate an EXPENSE transaction with an INCOME category.");
        }

        Expense expense = new Expense();
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setDescription(request.getDescription());
        expense.setCurrency(request.getCurrency());
        expense.setCategory(category);
        expense.setUser(user);

        Expense savedExpense = expenseRepository.save(expense);
        log.debug("Expense transaction saved successfully with ID: {} for user ID: {}", savedExpense.getId(), user.getId());
        return mapToDto(savedExpense);
    }

    @Transactional
    public TransactionResponse updateExpense(Long id, TransactionRequest request, User user) {
        log.debug("Processing request to update expense ID: {} for user ID: {}", id, user.getId());
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Failed to update expense: Expense transaction ID {} not found", id);
                    return new ResourceNotFoundException("Expense not found with id: " + id);
                });

        if (!expense.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden update attempt on expense ID {} by user ID {} (owner is user ID {})", 
                    id, user.getId(), expense.getUser().getId());
            throw new IllegalArgumentException("You do not have permission to update this transaction.");
        }

        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> {
                    log.warn("Failed to update expense ID {}: Category ID {} not found for user ID: {}", 
                            id, request.getCategoryId(), user.getId());
                    return new ResourceNotFoundException("Category not found with id: " + request.getCategoryId());
                });

        if (category.getType() != CategoryType.EXPENSE) {
            log.warn("Failed to update expense ID {}: Category ID {} type is {}, expected EXPENSE for user ID: {}", 
                    id, category.getId(), category.getType(), user.getId());
            throw new IllegalArgumentException("Cannot associate an EXPENSE transaction with an INCOME category.");
        }

        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setDescription(request.getDescription());
        expense.setCurrency(request.getCurrency());
        expense.setCategory(category);

        Expense updatedExpense = expenseRepository.save(expense);
        log.debug("Expense transaction ID: {} updated successfully for user ID: {}", updatedExpense.getId(), user.getId());
        return mapToDto(updatedExpense);
    }

    @Transactional
    public void deleteExpense(Long id, User user) {
        log.debug("Processing request to delete expense ID: {} for user ID: {}", id, user.getId());
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Failed to delete expense: Expense transaction ID {} not found", id);
                    return new ResourceNotFoundException("Expense not found with id: " + id);
                });

        if (!expense.getUser().getId().equals(user.getId())) {
            log.warn("Forbidden deletion attempt on expense ID {} by user ID {} (owner is user ID {})", 
                    id, user.getId(), expense.getUser().getId());
            throw new IllegalArgumentException("You do not have permission to delete this transaction.");
        }

        expenseRepository.delete(expense);
        log.debug("Expense transaction ID: {} deleted successfully for user ID: {}", id, user.getId());
    }

    public Page<TransactionResponse> getCombinedTransactions(User user, Long categoryId, LocalDate startDate, LocalDate endDate, String search, Pageable pageable) {
        log.debug("Fetching combined transactions for user ID: {} (categoryId={}, startDate={}, endDate={}, search={})", 
                user.getId(), categoryId, startDate, endDate, search);
        // Fetch all matching incomes
        List<Income> incomes = incomeRepository.findByUser(user);
        // Fetch all matching expenses
        List<Expense> expenses = expenseRepository.findByUser(user);

        List<TransactionResponse> combined = new ArrayList<>();

        // Map and filter Incomes
        incomes.stream()
                .filter(i -> categoryId == null || i.getCategory().getId().equals(categoryId))
                .filter(i -> startDate == null || !i.getDate().isBefore(startDate))
                .filter(i -> endDate == null || !i.getDate().isAfter(endDate))
                .filter(i -> search == null || (i.getDescription() != null && i.getDescription().toLowerCase().contains(search.toLowerCase())))
                .forEach(i -> combined.add(mapToDto(i)));

        // Map and filter Expenses
        expenses.stream()
                .filter(e -> categoryId == null || e.getCategory().getId().equals(categoryId))
                .filter(e -> startDate == null || !e.getDate().isBefore(startDate))
                .filter(e -> endDate == null || !e.getDate().isAfter(endDate))
                .filter(e -> search == null || (e.getDescription() != null && e.getDescription().toLowerCase().contains(search.toLowerCase())))
                .forEach(e -> combined.add(mapToDto(e)));

        // Sort by date descending
        combined.sort(Comparator.comparing(TransactionResponse::getDate).reversed()
                .thenComparing(TransactionResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        log.debug("Combined transaction list size before pagination: {}", combined.size());

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), combined.size());

        List<TransactionResponse> subList = new ArrayList<>();
        if (start < combined.size()) {
            subList = combined.subList(start, end);
        }

        log.debug("Paged combined transactions result: size={}, total={}", subList.size(), combined.size());
        return new PageImpl<>(subList, pageable, combined.size());
    }

    public SummaryResponse getSummary(User user, LocalDate startDate, LocalDate endDate) {
        // Fallback default to current month
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        log.debug("Fetching summary for user ID: {} between {} and {}", user.getId(), start, end);
        List<Income> incomes = incomeRepository.findByUserAndDateBetween(user, start, end);
        List<Expense> expenses = expenseRepository.findByUserAndDateBetween(user, start, end);

        BigDecimal totalIncome = incomes.stream()
                .map(i -> currencyService.convert(i.getAmount(), i.getCurrency(), "USD"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenses.stream()
                .map(e -> currencyService.convert(e.getAmount(), e.getCurrency(), "USD"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        log.debug("Summary computed for user ID: {}: totalIncome={}, totalExpense={}, netSavings={}", 
                user.getId(), totalIncome, totalExpense, netSavings);
        return new SummaryResponse(totalIncome, totalExpense, netSavings);
    }

    public TransactionResponse mapToDto(Income income) {
        return new TransactionResponse(
                income.getId(),
                income.getAmount(),
                income.getDate(),
                income.getDescription(),
                income.getCurrency(),
                CategoryType.INCOME,
                categoryService.mapToDto(income.getCategory()),
                income.getCreatedAt()
        );
    }

    public TransactionResponse mapToDto(Expense expense) {
        return new TransactionResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getDate(),
                expense.getDescription(),
                expense.getCurrency(),
                CategoryType.EXPENSE,
                categoryService.mapToDto(expense.getCategory()),
                expense.getCreatedAt()
        );
    }
}
