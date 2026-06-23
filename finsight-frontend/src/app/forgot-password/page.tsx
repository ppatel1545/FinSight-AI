"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: "request", Step 2: "reset", Step 3: "success"
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Local test help to display the generated token directly on screen
  const [devToken, setDevToken] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const response = await api.post("/auth/forgot-password", payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      // response.data contains the generated token string
      setDevToken(response.data);
      setSuccessMessage("Reset code generated! Please see below.");
      setStep("reset");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Something went wrong. Please check the email and try again.";
      setErrorMessage(message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: typeof resetPayload) => {
      const response = await api.post("/auth/reset-password", payload);
      return response.data;
    },
    onSuccess: () => {
      setStep("success");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Invalid or expired code. Please try again.";
      setErrorMessage(message);
    },
  });

  const resetPayload = {
    email,
    token,
    newPassword,
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }
    setErrorMessage(null);
    forgotPasswordMutation.mutate({ email });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      setErrorMessage("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    setErrorMessage(null);
    resetPasswordMutation.mutate(resetPayload);
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
          <p className="mt-2 text-sm text-[#8c8c99]">Password Recovery</p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-center text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        {step === "request" && (
          <form onSubmit={handleRequestSubmit} className="space-y-5">
            <p className="text-xs text-[#8c8c99] leading-relaxed">
              Enter your registered email address below, and we will generate a password recovery verification code.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
                disabled={forgotPasswordMutation.isPending}
              />
            </div>

            <button
              type="submit"
              className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg outline-none transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Requesting Code...
                </span>
              ) : (
                "Request Reset Code"
              )}
            </button>

            <div className="mt-6 text-center text-xs">
              <Link href="/login" className="font-semibold text-indigo-400 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            {successMessage && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-center text-xs text-emerald-400">
                {successMessage}
              </div>
            )}

            {devToken && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/30 p-3.5 text-xs text-[#a1a1b5] leading-relaxed">
                💡 <span className="font-bold text-indigo-300">Local Testing Note:</span> Your generated reset code is:{" "}
                <code className="bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded text-sm tracking-wider">
                  {devToken}
                </code>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5] mb-2">
                Verification Reset Code
              </label>
              <input
                type="text"
                name="token"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter 6-digit code"
                className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none tracking-widest text-center transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5] mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            <button
              type="submit"
              className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg outline-none transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>

            <div className="mt-6 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-semibold text-indigo-400 hover:underline bg-transparent border-none outline-none cursor-pointer"
              >
                Back to Step 1
              </button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xl font-bold">
              ✓
            </div>
            
            <h3 className="text-lg font-bold text-slate-100">Password Reset Successful</h3>
            <p className="text-xs text-[#8c8c99] leading-relaxed">
              Your password has been successfully updated. You can now use your new password to log in to your account.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-emerald-500 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:brightness-110 hover:scale-[1.01]"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
