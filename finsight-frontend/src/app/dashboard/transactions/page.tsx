"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import api from "@/lib/api";
import TransactionModal from "@/components/transactionModal";

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

interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  category: Category;
}

interface PageData {
  content: Transaction[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export default function TransactionsHistoryPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filter and pagination states
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Active query parameters (propagating filters to the backend)
  const activeCategoryId = categoryId ? parseInt(categoryId) : undefined;
  const activeSearch = search.trim() ? search.trim() : undefined;
  const activeStartDate = startDate || undefined;
  const activeEndDate = endDate || undefined;

  // Fetch categories (for filter dropdown)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data;
    },
  });

  // Fetch transactions list
  const { data: pageData, isLoading } = useQuery<PageData>({
    queryKey: ["transactions", page, typeFilter, activeCategoryId, activeStartDate, activeEndDate, activeSearch],
    queryFn: async () => {
      // If we are looking for a specific type, we can filter locally or let the service handle it.
      // Since our GET /transactions combined endpoint supports category, start/end dates, and search, we query it.
      const response = await api.get("/transactions", {
        params: {
          categoryId: activeCategoryId,
          startDate: activeStartDate,
          endDate: activeEndDate,
          search: activeSearch,
          page,
          size: pageSize,
        },
      });

      const data = response.data.data;
      
      // If a specific type filter is active, filter the content list
      if (typeFilter !== "ALL") {
        const filteredContent = data.content.filter((t: Transaction) => t.type === typeFilter);
        return {
          ...data,
          content: filteredContent,
        };
      }

      return data;
    },
  });

  // Fetch summary stats based on current dates
  const { data: summary } = useQuery({
    queryKey: ["summary", activeStartDate, activeEndDate],
    queryFn: async () => {
      const response = await api.get("/transactions/summary", {
        params: {
          startDate: activeStartDate,
          endDate: activeEndDate,
        },
      });
      return response.data.data;
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (payload: { id: number; type: "INCOME" | "EXPENSE" }) => {
      const endpoint = payload.type === "INCOME" ? "/transactions/incomes" : "/transactions/expenses";
      await api.delete(`${endpoint}/${payload.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, type: "INCOME" | "EXPENSE") => {
    if (confirm("Are you sure you want to delete this transaction log?")) {
      deleteMutation.mutate({ id, type });
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryId("");
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0d0d0f] text-[#ededed] p-6">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/3 h-96 w-96 rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-10 right-1/3 h-96 w-96 rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      <header className="relative z-10 flex w-full max-w-5xl mx-auto items-center justify-between border-b border-white/5 py-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[#8c8c99] hover:text-white transition">
            <Icons.ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <span className="h-4 w-[1px] bg-white/10" />
          <h1 className="text-xl font-bold text-white">Cash Flow Log History</h1>
        </div>
        <button
          onClick={() => {
            setSelectedTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:scale-[0.98] transition"
        >
          <Icons.Plus className="h-4 w-4" />
          Log Transaction
        </button>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto space-y-6">
        {/* Dynamic Aggregated Financial Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold text-[#8c8c99] uppercase tracking-wider">Total Income</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-2">
                ${summary.totalIncome.toFixed(2)}
              </h3>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold text-[#8c8c99] uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-2xl font-bold text-red-400 mt-2">
                ${summary.totalExpense.toFixed(2)}
              </h3>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold text-[#8c8c99] uppercase tracking-wider">Net Savings</p>
              <h3 className={`text-2xl font-bold mt-2 ${summary.netSavings >= 0 ? "text-indigo-400" : "text-amber-500"}`}>
                ${summary.netSavings.toFixed(2)}
              </h3>
            </div>
          </div>
        )}

        {/* Search & Advanced Filters Toolbar */}
        <div className="rounded-2xl border border-white/5 bg-[#141416]/30 p-5 space-y-4 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5c5c6b]" />
              <input
                type="text"
                placeholder="Search descriptions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] pl-9.5 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setPage(0);
              }}
              className="rounded-lg border border-white/5 bg-[#1a1a1e] px-3 py-2.5 text-xs outline-none focus:border-indigo-500/50 text-[#ededed]"
            >
              <option value="ALL">All Flow Types</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expenses Only</option>
            </select>

            {/* Category */}
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-white/5 bg-[#1a1a1e] px-3 py-2.5 text-xs outline-none focus:border-indigo-500/50 text-[#ededed]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold hover:bg-white/10 transition"
            >
              <Icons.RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-center">
            <span className="text-xs text-[#8c8c99] font-medium">Filter Date Range:</span>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                className="rounded-lg border border-white/5 bg-[#1a1a1e] px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50 text-[#ededed] w-full md:w-auto"
              />
              <span className="text-[#8c8c99] text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                className="rounded-lg border border-white/5 bg-[#1a1a1e] px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50 text-[#ededed] w-full md:w-auto"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-2xl border border-white/5 bg-[#141416]/40 overflow-hidden backdrop-blur-xl">
          {isLoading ? (
            <div className="flex py-20 justify-center">
              <Icons.Loader className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : !pageData || pageData.content.length === 0 ? (
            <div className="text-center py-20 text-[#8c8c99] text-sm">
              <Icons.Inbox className="h-8 w-8 mx-auto text-[#5c5c6b] mb-2" />
              No matching transaction logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-bold text-[#8c8c99] tracking-wider">
                    <th className="py-4 px-6">Flow</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-[#ededed]">
                  {pageData.content.map((t) => (
                    <tr key={`${t.type}-${t.id}`} className="hover:bg-white/2 transition">
                      <td className="py-4 px-6">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            t.type === "INCOME"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div
                            style={{ backgroundColor: `${t.category.colorCode}20`, color: t.category.colorCode }}
                            className="flex h-7 w-7 items-center justify-center rounded"
                          >
                            <CategoryIcon name={t.category.iconName} className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium">{t.category.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#ededed] font-medium max-w-xs truncate">
                        {t.description || <span className="text-[#5c5c6b] italic">No description</span>}
                      </td>
                      <td className="py-4 px-6 font-mono text-[#8c8c99]">{t.date}</td>
                      <td className={`py-4 px-6 text-right font-mono font-bold ${
                        t.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {t.type === "INCOME" ? "+" : "-"}${t.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1.5 text-[#8c8c99] hover:text-indigo-400 transition"
                          >
                            <Icons.Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.type)}
                            className="p-1.5 text-[#8c8c99] hover:text-red-400 transition"
                          >
                            <Icons.Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {pageData.totalPages > 1 && (
                <div className="flex justify-between items-center border-t border-white/5 px-6 py-4 bg-white/2">
                  <span className="text-xs text-[#8c8c99]">
                    Showing Page {page + 1} of {pageData.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="rounded border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#8c8c99] hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40 transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
                      disabled={page >= pageData.totalPages - 1}
                      className="rounded border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#8c8c99] hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Shared Transaction Form Modal Overlay */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transactionToEdit={selectedTransaction}
      />
    </div>
  );
}
