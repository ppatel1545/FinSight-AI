"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import TransactionModal from "@/components/transactionModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0d0d0f] text-[#ededed] p-6">
      {/* Background Glowing Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Header Panel */}
      <header className="relative z-10 flex w-full max-w-5xl mx-auto items-center justify-between border-b border-white/5 py-4 mb-10">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-sm tracking-wider font-semibold text-[#8c8c99]">
            FINSIGHT AI // SYSTEM STATUS: ACTIVE
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10 transition duration-300"
        >
          Sign Out
        </button>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-center pt-8">
        {/* User Card */}
        <div className="w-full md:w-5/12 rounded-2xl border border-white/5 bg-[#141416]/50 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              Welcome back
            </h2>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              {user?.username || "Commander"}
            </h1>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[#8c8c99]">Account Email</span>
              <span className="font-mono text-white">{user?.email || "n/a"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[#8c8c99]">System Identifier</span>
              <span className="font-mono text-indigo-300">ID-{user?.id || "n/a"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#8c8c99]">Assigned Security Roles</span>
              <div className="flex gap-2">
                {user?.roles?.map((role) => (
                  <span
                    key={role}
                    className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/20"
                  >
                    {role}
                  </span>
                )) || <span className="text-white">n/a</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Actions Panel */}
        <div className="w-full md:w-7/12 space-y-4">
          <h2 className="text-xs uppercase font-bold text-[#8c8c99] tracking-wider mb-2">
            Workspace Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* View Logs */}
            <Link
              href="/dashboard/transactions"
              className="flex flex-col rounded-2xl border border-white/5 bg-[#141416]/30 p-6 hover:bg-[#1f1f25]/40 transition shadow-lg backdrop-blur-md text-left"
            >
              <Icons.History className="h-6 w-6 text-indigo-400 mb-4" />
              <h3 className="text-sm font-bold text-white mb-1">Cash Flow Logs</h3>
              <p className="text-xs text-[#8c8c99]">View, search and filter logged transactions history.</p>
            </Link>

            {/* View Categories */}
            <Link
              href="/dashboard/categories"
              className="flex flex-col rounded-2xl border border-white/5 bg-[#141416]/30 p-6 hover:bg-[#1f1f25]/40 transition shadow-lg backdrop-blur-md text-left"
            >
              <Icons.Tags className="h-6 w-6 text-purple-400 mb-4" />
              <h3 className="text-sm font-bold text-white mb-1">Categories</h3>
              <p className="text-xs text-[#8c8c99]">Manage system-default and custom custom transaction tags.</p>
            </Link>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-4 font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition duration-300"
          >
            <Icons.PlusCircle className="h-5 w-5" />
            Quick Log Transaction
          </button>
        </div>
      </main>

      {/* Quick Log Transaction Modal Overlay */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
