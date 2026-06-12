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

const PRESET_ICONS = [
  "Briefcase", "Laptop", "TrendingUp", "PlusCircle", "Utensils",
  "Home", "Zap", "Car", "Film", "HeartPulse", "ShoppingBag",
  "DollarSign", "Gift", "Coffee", "Plane", "BookOpen", "Wrench"
];

const PRESET_COLORS = [
  "#10b981", "#06b6d4", "#14b8a6", "#84cc16", "#f97316",
  "#ef4444", "#eab308", "#3b82f6", "#a855f7", "#ec4899",
  "#6366f1", "#4b5563"
];

interface Category {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  colorCode: string;
  iconName: string;
  isCustom: boolean;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    colorCode: PRESET_COLORS[0],
    iconName: PRESET_ICONS[0],
  });

  // Query categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data;
    },
  });

  // Mutation to add custom category
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: typeof newCategory) => {
      const response = await api.post("/categories", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowAddForm(false);
      setNewCategory({
        name: "",
        type: "EXPENSE",
        colorCode: PRESET_COLORS[0],
        iconName: PRESET_ICONS[0],
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to create category.";
      setErrorMessage(msg);
    },
  });

  // Mutation to delete custom category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

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
          <h1 className="text-xl font-bold text-white">Categories Management</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:scale-[0.98] transition"
        >
          <Icons.Plus className="h-4 w-4" />
          Add Custom Category
        </button>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto space-y-8">
        {/* Add Category Dialog (Glass overlay) */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#141416] p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-4">New Custom Category</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-2.5 text-xs text-red-400 text-center">
                    {errorMessage}
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Category Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => {
                      setNewCategory((prev) => ({ ...prev, name: e.target.value }));
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. Subscriptions, Salary bonus"
                    className="w-full rounded-lg border border-white/5 bg-[#1a1a1e] px-4.5 py-2.5 text-sm outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Transaction Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-[#ededed] cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={newCategory.type === "EXPENSE"}
                        onChange={() => setNewCategory((prev) => ({ ...prev, type: "EXPENSE" }))}
                        className="accent-indigo-500"
                      />
                      Expense
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#ededed] cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={newCategory.type === "INCOME"}
                        onChange={() => setNewCategory((prev) => ({ ...prev, type: "INCOME" }))}
                        className="accent-indigo-500"
                      />
                      Income
                    </label>
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Theme Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewCategory((prev) => ({ ...prev, colorCode: col }))}
                        style={{ backgroundColor: col }}
                        className={`h-6 w-6 rounded-full border-2 transition ${newCategory.colorCode === col ? "border-white scale-110" : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block text-xs uppercase text-[#8c8c99] font-bold mb-2">Icon Representation</label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-white/5 bg-[#1a1a1e] p-2.5 rounded-lg">
                    {PRESET_ICONS.map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setNewCategory((prev) => ({ ...prev, iconName: ico }))}
                        className={`flex h-8 items-center justify-center rounded transition ${newCategory.iconName === ico ? "bg-indigo-500 text-white" : "text-[#8c8c99] hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        <CategoryIcon name={ico} className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setErrorMessage(null);
                    }}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-[#8c8c99] hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition"
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? "Creating..." : "Save Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex py-20 justify-center">
            <Icons.Loader className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Expense Categories Panel */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-6 backdrop-blur-xl">
              <h2 className="text-md font-bold text-red-400 border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                <Icons.TrendingDown className="h-4 w-4" />
                Expense Categories
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {expenseCategories.map((c) => (
                  <div
                    key={c.id}
                    className="group relative flex items-center gap-3 rounded-xl border border-white/5 bg-[#1a1a1e]/50 p-3"
                  >
                    <div
                      style={{ backgroundColor: `${c.colorCode}20`, color: c.colorCode }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                    >
                      <CategoryIcon name={c.iconName} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-[#8c8c99]">{c.isCustom ? "Custom" : "System"}</p>
                    </div>
                    {c.isCustom && (
                      <button
                        onClick={() => deleteCategoryMutation.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-[#8c8c99] hover:text-red-400 transition"
                      >
                        <Icons.Trash className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Income Categories Panel */}
            <div className="rounded-2xl border border-white/5 bg-[#141416]/40 p-6 backdrop-blur-xl">
              <h2 className="text-md font-bold text-emerald-400 border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                <Icons.TrendingUp className="h-4 w-4" />
                Income Categories
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {incomeCategories.map((c) => (
                  <div
                    key={c.id}
                    className="group relative flex items-center gap-3 rounded-xl border border-white/5 bg-[#1a1a1e]/50 p-3"
                  >
                    <div
                      style={{ backgroundColor: `${c.colorCode}20`, color: c.colorCode }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                    >
                      <CategoryIcon name={c.iconName} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-[#8c8c99]">{c.isCustom ? "Custom" : "System"}</p>
                    </div>
                    {c.isCustom && (
                      <button
                        onClick={() => deleteCategoryMutation.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-[#8c8c99] hover:text-red-400 transition"
                      >
                        <Icons.Trash className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
