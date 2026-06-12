package com.finsight.backend.service;

import com.finsight.backend.dto.*;
import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.*;
import com.finsight.backend.repository.CategoryRepository;
import com.finsight.backend.repository.ExpenseRepository;
import com.finsight.backend.repository.IncomeRepository;
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

    @Transactional
    public TransactionResponse createIncome(TransactionRequest request, User user) {
        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (category.getType() != CategoryType.INCOME) {
            throw new IllegalArgumentException("Cannot associate an INCOME transaction with an EXPENSE category.");
        }

        Income income = new Income();
        income.setAmount(request.getAmount());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription());
        income.setCategory(category);
        income.setUser(user);

        return mapToDto(incomeRepository.save(income));
    }

    @Transactional
    public TransactionResponse updateIncome(Long id, TransactionRequest request, User user) {
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));

        if (!income.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to update this transaction.");
        }

        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (category.getType() != CategoryType.INCOME) {
            throw new IllegalArgumentException("Cannot associate an INCOME transaction with an EXPENSE category.");
        }

        income.setAmount(request.getAmount());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription());
        income.setCategory(category);

        return mapToDto(incomeRepository.save(income));
    }

    @Transactional
    public void deleteIncome(Long id, User user) {
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));

        if (!income.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to delete this transaction.");
        }

        incomeRepository.delete(income);
    }

    @Transactional
    public TransactionResponse createExpense(TransactionRequest request, User user) {
        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new IllegalArgumentException("Cannot associate an EXPENSE transaction with an INCOME category.");
        }

        Expense expense = new Expense();
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setDescription(request.getDescription());
        expense.setCategory(category);
        expense.setUser(user);

        return mapToDto(expenseRepository.save(expense));
    }

    @Transactional
    public TransactionResponse updateExpense(Long id, TransactionRequest request, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to update this transaction.");
        }

        Category category = categoryRepository.findByIdAndUserOrIsCustomFalse(request.getCategoryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new IllegalArgumentException("Cannot associate an EXPENSE transaction with an INCOME category.");
        }

        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setDescription(request.getDescription());
        expense.setCategory(category);

        return mapToDto(expenseRepository.save(expense));
    }

    @Transactional
    public void deleteExpense(Long id, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to delete this transaction.");
        }

        expenseRepository.delete(expense);
    }

    public Page<TransactionResponse> getCombinedTransactions(User user, Long categoryId, LocalDate startDate, LocalDate endDate, String search, Pageable pageable) {
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

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), combined.size());

        List<TransactionResponse> subList = new ArrayList<>();
        if (start < combined.size()) {
            subList = combined.subList(start, end);
        }

        return new PageImpl<>(subList, pageable, combined.size());
    }

    public SummaryResponse getSummary(User user, LocalDate startDate, LocalDate endDate) {
        // Fallback default to current month
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<Income> incomes = incomeRepository.findByUserAndDateBetween(user, start, end);
        List<Expense> expenses = expenseRepository.findByUserAndDateBetween(user, start, end);

        BigDecimal totalIncome = incomes.stream()
                .map(Income::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        return new SummaryResponse(totalIncome, totalExpense, netSavings);
    }

    public TransactionResponse mapToDto(Income income) {
        return new TransactionResponse(
                income.getId(),
                income.getAmount(),
                income.getDate(),
                income.getDescription(),
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
                CategoryType.EXPENSE,
                categoryService.mapToDto(expense.getCategory()),
                expense.getCreatedAt()
        );
    }
}
