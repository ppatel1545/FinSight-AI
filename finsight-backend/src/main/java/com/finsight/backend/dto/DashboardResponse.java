package com.finsight.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private SummaryResponse summary;
    private List<BudgetResponse> budgets;
    private List<TransactionResponse> recentTransactions;
    private List<CategoryBreakdownDto> categoryBreakdown;
    private List<MonthlyTrendDto> monthlyTrends;
}
