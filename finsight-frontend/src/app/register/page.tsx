"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const response = await api.post("/auth/signup", payload);
      return response.data;
    },
    onSuccess: () => {
      router.push("/login?signup=success");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Registration failed. Please try again.";
      setErrorMessage(message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      setErrorMessage("All fields are required.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    registerMutation.mutate(formData);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0d0d0f] p-4 text-[#ededed]">
      {/* Background Glowing Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      {/* Glass Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#141416]/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-3xl font-extrabold text-transparent tracking-tight">
            FinSight AI
          </h1>
          <p className="mt-2 text-sm text-[#8c8c99]">Create your financial intelligence account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-center text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5] mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g., johndoe"
              className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
              disabled={registerMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5] mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
              disabled={registerMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5] mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
              disabled={registerMutation.isPending}
            />
          </div>

          <button
            type="submit"
            className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg outline-none transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing up...
              </span>
            ) : (
              "Get Started Free"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-[#8c8c99]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-400 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
