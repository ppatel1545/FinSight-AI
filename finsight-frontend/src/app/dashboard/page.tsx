"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import TransactionModal from "@/components/transactionModal";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Dynamic Icon rendering helper
const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (Icons as any)[name];
  if (!Icon) return <Icons.Tag className={className} />;
  return <Icon className={className} />;
};

interface Category {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  colorCode: string;
  iconName: string;
}

interface TransactionResponse {
  id: number;
  amount: number;
  date: string;
  description: string;
  currency: string;
  type: "INCOME" | "EXPENSE";
  category: Category;
  createdAt: string;
}

interface BudgetResponse {
  id: number;
  limitAmount: number;
  monthYear: string;
  category: Category;
  spentAmount: number;
  remainingAmount: number;
  thresholdStatus: "GREEN" | "AMBER" | "RED";
}

interface CategoryBreakdownDto {
  categoryId: number;
  categoryName: string;
  colorCode: string;
  iconName: string;
  totalSpent: number;
  percentage: number;
}

interface MonthlyTrendDto {
  monthYear: string;
  income: number;
  expense: number;
  savings: number;
}

interface SummaryResponse {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

interface DashboardResponse {
  summary: SummaryResponse;
  budgets: BudgetResponse[];
  recentTransactions: TransactionResponse[];
  categoryBreakdown: CategoryBreakdownDto[];
  monthlyTrends: MonthlyTrendDto[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "元",
  AED: "د.إ"
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // Fetch all aggregated dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data.data;
    }
  });

  const summary = dashboardData?.summary;
  const budgets = dashboardData?.budgets || [];
  const recentTransactions = dashboardData?.recentTransactions || [];
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];
  const monthlyTrends = dashboardData?.monthlyTrends || [];

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0d0d0f] text-[#ededed] p-6">
      {/* Background Glowing Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Header Panel */}
      <header className="relative z-10 flex w-full max-w-6xl mx-auto items-center justify-between border-b border-white/5 py-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-mono text-xs tracking-wider font-semibold text-[#8c8c99]">
            FINSIGHT AI // WORKSPACE OVERVIEW
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#8c8c99] hidden sm:inline">
            Active User: <span className="text-white font-semibold">{user?.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold hover:bg-white/10 hover:border-white/20 transition duration-300"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto space-y-6">
        {/* Top Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl border border-white/5 bg-[#141416]/40 p-6" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Income Card */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl hover:border-emerald-500/20 transition-all duration-300">
              <div className="flex justify-between items-center text-[#8c8c99]">
                <p className="text-xs font-bold uppercase tracking-wider">Monthly Income</p>
                <Icons.TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
                ${summary?.totalIncome?.toFixed(2) || "0.00"}
              </h3>
              <p className="text-[10px] text-[#5c5c6b] mt-1">Cash inflow for this month</p>
            </div>

            {/* Expenses Card */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl hover:border-red-500/20 transition-all duration-300">
              <div className="flex justify-between items-center text-[#8c8c99]">
                <p className="text-xs font-bold uppercase tracking-wider">Monthly Expenses</p>
                <Icons.TrendingDown className="h-4 w-4 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-red-400 mt-2 font-mono">
                ${summary?.totalExpense?.toFixed(2) || "0.00"}
              </h3>
              <p className="text-[10px] text-[#5c5c6b] mt-1">Cash outflow for this month</p>
            </div>

            {/* Savings Card */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-300">
              <div className="flex justify-between items-center text-[#8c8c99]">
                <p className="text-xs font-bold uppercase tracking-wider">Net Savings</p>
                <Icons.Layers className="h-4 w-4 text-indigo-400" />
              </div>
              <h3 className={`text-2xl font-bold mt-2 font-mono ${(summary?.netSavings ?? 0) >= 0 ? "text-indigo-400" : "text-amber-500"}`}>
                ${summary?.netSavings?.toFixed(2) || "0.00"}
              </h3>
              <p className="text-[10px] text-[#5c5c6b] mt-1">Remaining liquid balance</p>
            </div>
          </div>
        )}

        {/* Action Center Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#141416]/30 py-3 px-4 font-semibold text-white hover:bg-[#1f1f25]/50 transition duration-300 shadow-md text-xs hover:border-white/10"
          >
            <Icons.PlusCircle className="h-4 w-4 text-indigo-400" />
            Log Transaction
          </button>
          <Link
            href="/dashboard/budgets"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#141416]/30 py-3 px-4 font-semibold text-white hover:bg-[#1f1f25]/50 transition duration-300 shadow-md text-xs hover:border-white/10"
          >
            <Icons.PiggyBank className="h-4 w-4 text-emerald-400" />
            Set Budgets
          </Link>
          <Link
            href="/dashboard/categories"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#141416]/30 py-3 px-4 font-semibold text-white hover:bg-[#1f1f25]/50 transition duration-300 shadow-md text-xs hover:border-white/10"
          >
            <Icons.Tags className="h-4 w-4 text-purple-400" />
            Categories
          </Link>
          <Link
            href="/dashboard/transactions"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#141416]/30 py-3 px-4 font-semibold text-white hover:bg-[#1f1f25]/50 transition duration-300 shadow-md text-xs hover:border-white/10"
          >
            <Icons.History className="h-4 w-4 text-pink-400" />
            View Logs
          </Link>
        </div>

        {/* Visual Charts Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 h-80 rounded-2xl border border-white/5 bg-[#141416]/40" />
            <div className="h-80 rounded-2xl border border-white/5 bg-[#141416]/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Composed Cash Flow Chart (Income vs Expense vs Savings) */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c8c99] mb-4 flex items-center gap-2">
                <Icons.Activity className="h-3.5 w-3.5 text-indigo-400" />
                6-Month Financial Trend
              </h3>
              <div className="flex-1 w-full min-h-[260px] text-xs font-mono">
                {mounted && monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={monthlyTrends} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="monthYear" stroke="#5c5c6b" tickLine={false} />
                      <YAxis stroke="#5c5c6b" tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#141416", borderColor: "rgba(255,255,255,0.05)" }}
                        itemStyle={{ color: "#ededed" }}
                      />
                      <Legend iconSize={8} />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} maxBarSize={30} />
                      <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} maxBarSize={30} />
                      <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[#5c5c6b] italic">
                    Not enough trend data. Log transactions across multiple months.
                  </div>
                )}
              </div>
            </div>

            {/* Pie Chart: Expense Distribution */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c8c99] mb-4 flex items-center gap-2">
                <Icons.PieChartIcon className="h-3.5 w-3.5 text-purple-400" />
                Expense Breakdown
              </h3>
              <div className="flex-1 w-full min-h-[220px] flex items-center justify-center relative text-xs">
                {mounted && categoryBreakdown.length > 0 ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            dataKey="totalSpent"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={3}
                          >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.colorCode || "#a855f7"} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#141416", borderColor: "rgba(255,255,255,0.05)" }}
                            itemStyle={{ color: "#ededed" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend list */}
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-[90px] overflow-y-auto pr-1">
                      {categoryBreakdown.slice(0, 4).map((entry) => (
                        <div key={entry.categoryId} className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.colorCode }}
                          />
                          <span className="text-[10px] text-[#ededed] truncate font-medium flex-1">
                            {entry.categoryName}
                          </span>
                          <span className="text-[10px] font-mono text-[#8c8c99]">
                            {entry.percentage.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#5c5c6b] italic text-center p-6">
                    <Icons.Inbox className="h-6 w-6 text-[#3c3c4b] mb-1" />
                    No expenses logged in this month.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lower Row: Budgets List & Recent Activity Feed */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-64 rounded-2xl border border-white/5 bg-[#141416]/40" />
            <div className="h-64 rounded-2xl border border-white/5 bg-[#141416]/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Budgets Watcher */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c8c99] flex items-center gap-2">
                    <Icons.PiggyBank className="h-3.5 w-3.5 text-emerald-400" />
                    Active Budgets Watch
                  </h3>
                  <Link href="/dashboard/budgets" className="text-[10px] text-indigo-400 hover:underline">
                    Manage Setup
                  </Link>
                </div>

                {budgets.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#8c8c99] italic">
                    No budgets configured for this month.
                    <div className="mt-3">
                      <Link
                        href="/dashboard/budgets"
                        className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition"
                      >
                        Set Budget Limits
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[190px] overflow-y-auto pr-1">
                    {budgets.slice(0, 3).map((b) => {
                      const percentage = Math.min((b.spentAmount / b.limitAmount) * 100, 100);
                      return (
                        <div key={b.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs items-center">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                style={{ color: b.category.colorCode }}
                                className="flex h-5 w-5 items-center justify-center rounded"
                              >
                                <CategoryIcon name={b.category.iconName} className="h-3 w-3" />
                              </div>
                              <span className="font-semibold text-white truncate">{b.category.name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-[#8c8c99]">
                              ${b.spentAmount.toFixed(0)} / ${b.limitAmount.toFixed(0)}
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              style={{
                                width: `${percentage}%`,
                                backgroundColor:
                                  b.thresholdStatus === "RED"
                                    ? "#ef4444"
                                    : b.thresholdStatus === "AMBER"
                                    ? "#f59e0b"
                                    : b.category.colorCode || "#10b981",
                              }}
                              className="h-full rounded-full transition-all duration-300"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {budgets.length > 3 && (
                <div className="text-center pt-2 text-[10px] text-[#8c8c99]">
                  + {budgets.length - 3} more budgets configured
                </div>
              )}
            </div>

            {/* Recent Transaction Log History */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c8c99] flex items-center gap-2">
                  <Icons.History className="h-3.5 w-3.5 text-pink-400" />
                  Recent Transaction Activity
                </h3>
                <Link href="/dashboard/transactions" className="text-[10px] text-indigo-400 hover:underline">
                  All Logs
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8c8c99] italic flex-1 flex items-center justify-center">
                  No logged transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-white/5 overflow-y-auto max-h-[190px] pr-1 flex-1">
                  {recentTransactions.map((t) => (
                    <div key={`${t.type}-${t.id}`} className="flex justify-between items-center pt-2.5 first:pt-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          style={{ backgroundColor: `${t.category.colorCode}20`, color: t.category.colorCode }}
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
                        >
                          <CategoryIcon name={t.category.iconName} className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#ededed] truncate">
                            {t.description || <span className="text-[#5c5c6b] italic">No description</span>}
                          </p>
                          <p className="text-[9px] text-[#8c8c99] font-mono">{t.date}</p>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold flex-shrink-0 ${t.type === "INCOME" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.type === "INCOME" ? "+" : "-"}{CURRENCY_SYMBOLS[t.currency] || "$"}{t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Shared Quick Log Transaction Modal Overlay */}
      <TransactionModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        // Invalidate queries to reload dashboard aggregator
        queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      }} />
    </div>
  );
}
