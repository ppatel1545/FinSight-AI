package com.finsight.backend.service;

import com.finsight.backend.dto.*;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.Expense;
import com.finsight.backend.model.Income;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.ExpenseRepository;
import com.finsight.backend.repository.IncomeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DashboardService {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private CurrencyService currencyService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(User user) {
        log.debug("Aggregating dashboard data for user ID: {}", user.getId());

        LocalDate now = LocalDate.now();
        LocalDate currentMonthStart = now.withDayOfMonth(1);
        LocalDate currentMonthEnd = now.withDayOfMonth(now.lengthOfMonth());
        String currentMonthYearStr = YearMonth.now().toString(); // YYYY-MM

        // 1. Get Monthly Summary
        SummaryResponse summary = transactionService.getSummary(user, currentMonthStart, currentMonthEnd);

        // 2. Get Budgets for Current Month
        List<BudgetResponse> budgets = budgetService.getBudgets(currentMonthYearStr, user);

        // 3. Get Top 5 Recent Transactions
        List<TransactionResponse> recentTransactions = transactionService.getCombinedTransactions(
                user, null, null, null, null, PageRequest.of(0, 5)).getContent();

        // 4. Calculate Category Spending Breakdown for Current Month
        List<Expense> currentMonthExpenses = expenseRepository.findByUserAndDateBetween(user, currentMonthStart, currentMonthEnd);
        BigDecimal totalExpenses = currentMonthExpenses.stream()
                .map(e -> currencyService.convert(e.getAmount(), e.getCurrency(), "USD"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Category, BigDecimal> spentByCategory = currentMonthExpenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.mapping(
                                e -> currencyService.convert(e.getAmount(), e.getCurrency(), "USD"),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        List<CategoryBreakdownDto> categoryBreakdown = new ArrayList<>();
        if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<Category, BigDecimal> entry : spentByCategory.entrySet()) {
                Category cat = entry.getKey();
                BigDecimal amount = entry.getValue();
                double percentage = amount.doubleValue() / totalExpenses.doubleValue() * 100.0;
                categoryBreakdown.add(new CategoryBreakdownDto(
                        cat.getId(),
                        cat.getName(),
                        cat.getColorCode(),
                        cat.getIconName(),
                        amount,
                        percentage
                ));
            }
            // Sort by amount descending
            categoryBreakdown.sort((a, b) -> b.getTotalSpent().compareTo(a.getTotalSpent()));
        }

        // 5. Generate 6-Month Monthly Trend Data Points
        List<MonthlyTrendDto> monthlyTrends = new ArrayList<>();
        YearMonth currentYM = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = currentYM.minusMonths(i);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();

            List<Income> incomes = incomeRepository.findByUserAndDateBetween(user, start, end);
            List<Expense> expenses = expenseRepository.findByUserAndDateBetween(user, start, end);

            BigDecimal incSum = incomes.stream()
                    .map(inc -> currencyService.convert(inc.getAmount(), inc.getCurrency(), "USD"))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);


            BigDecimal expSum = expenses.stream()
                    .map(e -> currencyService.convert(e.getAmount(), e.getCurrency(), "USD"))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal savings = incSum.subtract(expSum);

            monthlyTrends.add(new MonthlyTrendDto(ym.toString(), incSum, expSum, savings));
        }

        log.debug("Dashboard aggregation complete: user ID={}, budgetsCount={}, recentTransCount={}, breakdownCount={}, trendsCount={}", 
                user.getId(), budgets.size(), recentTransactions.size(), categoryBreakdown.size(), monthlyTrends.size());

        return new DashboardResponse(
                summary,
                budgets,
                recentTransactions,
                categoryBreakdown,
                monthlyTrends
        );
    }
}
