"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import api from "@/lib/api";

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

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export default function TransactionModal({ isOpen, onClose, transactionToEdit }: TransactionModalProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    categoryId: "",
  });

  // Query categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data;
    },
    enabled: isOpen, // Only query when modal is active
  });

  // Filter categories by type
  const filteredCategories = categories.filter((c) => c.type === formData.type);

  // Sync state if editing
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        amount: transactionToEdit.amount.toString(),
        date: transactionToEdit.date,
        description: transactionToEdit.description || "",
        type: transactionToEdit.type,
        categoryId: transactionToEdit.category.id.toString(),
      });
    } else {
      // Default to empty values or preset date
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        type: "EXPENSE",
        categoryId: "",
      });
    }
    setErrorMessage(null);
  }, [transactionToEdit, isOpen]);

  // Set default category when type switches
  useEffect(() => {
    if (filteredCategories.length > 0 && !transactionToEdit) {
      setFormData((prev) => {
        // If current category is not in the newly filtered list, default to first item
        const exists = filteredCategories.some((c) => c.id.toString() === prev.categoryId);
        if (!exists) {
          return { ...prev, categoryId: filteredCategories[0].id.toString() };
        }
        return prev;
      });
    }
  }, [formData.type, categories, filteredCategories, transactionToEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = formData.type === "INCOME" ? "/transactions/incomes" : "/transactions/expenses";
      const payload = {
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        categoryId: parseInt(formData.categoryId),
      };

      if (transactionToEdit) {
        // Update
        const response = await api.put(`${endpoint}/${transactionToEdit.id}`, payload);
        return response.data;
      } else {
        // Create
        const response = await api.post(endpoint, payload);
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate both cache endpoints to refresh totals and logs
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      onClose();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to save transaction.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setErrorMessage("Please enter a valid positive amount.");
      return;
    }
    if (!formData.categoryId) {
      setErrorMessage("Please select a transaction category.");
      return;
    }
    saveMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#141416] p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-4">
          {transactionToEdit ? "Edit Transaction Log" : "Log New Transaction"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-2.5 text-xs text-red-400 text-center">
              {errorMessage}
            </div>
          )}

          {/* Type Toggle */}
          {!transactionToEdit && (
            <div>
              <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2 bg-[#1a1a1e] p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "EXPENSE" }))}
                  className={`py-2 text-xs font-semibold rounded-md transition ${
                    formData.type === "EXPENSE"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm"
                      : "text-[#8c8c99] hover:text-white"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "INCOME" }))}
                  className={`py-2 text-xs font-semibold rounded-md transition ${
                    formData.type === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-[#8c8c99] hover:text-white"
                  }`}
                >
                  Income
                </button>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-sm text-[#8c8c99]">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] pl-8.5 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-[#ededed] appearance-none"
            >
              <option value="" disabled>Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Transaction Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-[#ededed]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Weekly groceries shopping, Salary payout"
              rows={3}
              className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-[#ededed]"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-[#8c8c99] hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
