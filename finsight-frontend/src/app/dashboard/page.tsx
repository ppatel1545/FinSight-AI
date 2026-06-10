"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

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
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center items-center">
        {/* Glass Card */}
        <div className="w-full max-w-xl rounded-2xl border border-white/5 bg-[#141416]/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              Welcome back
            </h2>
            <h1 className="text-4xl font-extrabold text-white mt-1">
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
      </main>
    </div>
  );
}
