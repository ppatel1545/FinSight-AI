"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import api from "@/lib/api";

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

interface BudgetResponse {
  id: number;
  limitAmount: number;
  monthYear: string;
  category: Category;
  spentAmount: number;
  remainingAmount: number;
  thresholdStatus: "GREEN" | "AMBER" | "RED";
  createdAt: string;
}

export default function BudgetsPage() {
  const queryClient = useQueryClient();

  // Current selected month: defaults to current month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Budget form state
  const [editingBudget, setEditingBudget] = useState<{
    id?: number;
    categoryId: number;
    categoryName: string;
    limitAmount: string;
  } | null>(null);

  // Fetch all categories (to display all expense categories)
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data;
    },
  });

  // Fetch user's budgets for the selected month
  const { data: budgets = [], isLoading: isBudgetsLoading } = useQuery<BudgetResponse[]>({
    queryKey: ["budgets", selectedMonth],
    queryFn: async () => {
      const response = await api.get("/budgets", {
        params: { monthYear: selectedMonth },
      });
      return response.data.data;
    },
  });

  // Mutation to save/upsert budget
  const saveBudgetMutation = useMutation({
    mutationFn: async (payload: { categoryId: number; limitAmount: number; monthYear: string }) => {
      const response = await api.post("/budgets", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      setIsDialogOpen(false);
      setEditingBudget(null);
      setErrorMessage(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to save budget.";
      setErrorMessage(msg);
    },
  });

  // Mutation to delete budget
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });

  const handleOpenConfigure = (category: Category, existingBudget?: BudgetResponse) => {
    setEditingBudget({
      id: existingBudget?.id,
      categoryId: category.id,
      categoryName: category.name,
      limitAmount: existingBudget ? String(existingBudget.limitAmount) : "",
    });
    setErrorMessage(null);
    setIsDialogOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    const limit = parseFloat(editingBudget.limitAmount);
    if (isNaN(limit) || limit <= 0) {
      setErrorMessage("Please enter a valid positive budget limit.");
      return;
    }

    saveBudgetMutation.mutate({
      categoryId: editingBudget.categoryId,
      limitAmount: limit,
      monthYear: selectedMonth,
    });
  };

  const handleDeleteBudget = (id: number) => {
    if (confirm("Are you sure you want to remove this budget?")) {
      deleteBudgetMutation.mutate(id);
    }
  };

  // Filter only EXPENSE categories
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  // Map budgets by Category ID for quick lookup
  const budgetMap = new Map<number, BudgetResponse>();
  budgets.forEach((b) => {
    budgetMap.set(b.category.id, b);
  });

  const isLoading = isCategoriesLoading || isBudgetsLoading;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0d0d0f] text-[#ededed] p-6">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 h-80 w-80 rounded-full bg-indigo-900/10 blur-[100px]" />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-purple-900/10 blur-[100px]" />
      </div>

      <header className="relative z-10 flex w-full max-w-5xl mx-auto items-center justify-between border-b border-white/5 py-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[#8c8c99] hover:text-white transition">
            <Icons.ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <span className="h-4 w-[1px] bg-white/10" />
          <h1 className="text-xl font-bold text-white">Monthly Budgets Setup</h1>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Icons.Calendar className="h-4 w-4 text-[#8c8c99]" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-white/5 bg-[#1a1a1e] px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50 text-[#ededed]"
          />
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex py-20 justify-center">
            <Icons.Loader className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : expenseCategories.length === 0 ? (
          <div className="text-center py-20 text-[#8c8c99] text-sm">
            <Icons.Tags className="h-8 w-8 mx-auto text-[#5c5c6b] mb-2" />
            No expense categories found. Please create categories first.
            <div className="mt-4">
              <Link
                href="/dashboard/categories"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition"
              >
                Go to Categories
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseCategories.map((cat) => {
              const b = budgetMap.get(cat.id);
              const percentage = b ? Math.min((b.spentAmount / b.limitAmount) * 100, 100) : 0;

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-md flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: `${cat.colorCode}20`, color: cat.colorCode }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                      >
                        <CategoryIcon name={cat.iconName} className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                        <p className="text-[10px] text-[#8c8c99]">Expense Category</p>
                      </div>
                    </div>

                    {b ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenConfigure(cat, b)}
                          className="p-1.5 rounded-md hover:bg-white/5 text-[#8c8c99] hover:text-indigo-400 transition"
                          title="Edit Limit"
                        >
                          <Icons.Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1.5 rounded-md hover:bg-white/5 text-[#8c8c99] hover:text-red-400 transition"
                          title="Remove Budget"
                        >
                          <Icons.Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenConfigure(cat)}
                        className="flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
                      >
                        <Icons.Plus className="h-3 w-3" />
                        Set Budget
                      </button>
                    )}
                  </div>

                  {b ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <div>
                          <span className="text-[#8c8c99]">Spent: </span>
                          <span className="font-mono font-semibold text-white">
                            ${b.spentAmount.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8c8c99]">Limit: </span>
                          <span className="font-mono font-semibold text-white">
                            ${b.limitAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              b.thresholdStatus === "RED"
                                ? "#ef4444"
                                : b.thresholdStatus === "AMBER"
                                ? "#f59e0b"
                                : cat.colorCode || "#10b981",
                          }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <div>
                          <span className="text-[#8c8c99]">Remaining: </span>
                          <span
                            className={`font-mono font-bold ${
                              b.remainingAmount < 0 ? "text-red-400" : "text-[#ededed]"
                            }`}
                          >
                            ${b.remainingAmount.toFixed(2)}
                          </span>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[8px] font-extrabold border ${
                            b.thresholdStatus === "RED"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : b.thresholdStatus === "AMBER"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {b.thresholdStatus === "RED"
                            ? "LIMIT EXCEEDED"
                            : b.thresholdStatus === "AMBER"
                            ? "WARNING (80%+)"
                            : "HEALTHY"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white/2 border border-dashed border-white/5 py-4 text-center text-xs text-[#5c5c6b] italic">
                      No budget configured for this month.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Configure / Edit Budget Dialog */}
        {isDialogOpen && editingBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm rounded-2xl border border-white/5 bg-[#141416] p-6 shadow-2xl">
              <h2 className="text-md font-bold text-white mb-1">
                {editingBudget.id ? "Edit Budget Limit" : "Configure Monthly Budget"}
              </h2>
              <p className="text-xs text-[#8c8c99] mb-4">
                Category: <span className="font-semibold text-indigo-400">{editingBudget.categoryName}</span>
              </p>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-2.5 text-xs text-red-400 text-center">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">
                    Monthly Limit Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingBudget.limitAmount}
                    onChange={(e) => {
                      setEditingBudget((prev) => prev ? { ...prev, limitAmount: e.target.value } : null);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. 500.00"
                    className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-[#ededed] font-mono"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingBudget(null);
                    }}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-[#8c8c99] hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition"
                    disabled={saveBudgetMutation.isPending}
                  >
                    {saveBudgetMutation.isPending ? "Saving..." : "Save Budget"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
