"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("signup") === "success") {
      setSuccessMessage("Account created successfully! Please log in below.");
    }
  }, [searchParams]);

  const loginMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const response = await api.post("/auth/login", payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      const { token, refreshToken, id, username, email, roles } = response.data;
      setAuth({ id, username, email, roles }, token, refreshToken);
      setIsRedirecting(true); // Keep overlay alive during Next.js navigation transition
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Invalid credentials. Please try again.";
      setErrorMessage(message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage("All fields are required.");
      return;
    }
    loginMutation.mutate(formData);
  };

  // Show overlay while API is running OR while Next.js is navigating to dashboard
  const isLoading = loginMutation.isPending || isRedirecting;

  return (
    <>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(13, 13, 15, 0.93)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <style>{`
            @keyframes finsight-ping {
              75%, 100% { transform: scale(1.9); opacity: 0; }
            }
            @keyframes finsight-spin {
              to { transform: rotate(360deg); }
            }
            @keyframes finsight-bounce {
              from { transform: translateY(0px); opacity: 0.5; }
              to   { transform: translateY(-9px); opacity: 1; }
            }
          `}</style>

          <div style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "28px" }}>
            <span
              style={{
                position: "absolute",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "rgba(99,102,241,0.18)",
                animation: "finsight-ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <span
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "4px solid rgba(99,102,241,0.25)",
                borderTopColor: "#818cf8",
                animation: "finsight-spin 0.85s linear infinite",
                display: "block",
              }}
            />
          </div>

          <p style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "6px" }}>
            Authenticating
          </p>
          <p style={{ color: "#8c8c99", fontSize: "12px", marginBottom: "22px" }}>
            Verifying your credentials...
          </p>

          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { color: "#818cf8", delay: "0ms" },
              { color: "#a78bfa", delay: "150ms" },
              { color: "#f472b6", delay: "300ms" },
            ].map((dot, i) => (
              <span
                key={i}
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: dot.color,
                  display: "inline-block",
                  animation: "finsight-bounce 0.7s ease-in-out infinite alternate",
                  animationDelay: dot.delay,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative flex min-h-screen items-center justify-center bg-[#0d0d0f] p-4 text-[#ededed]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-900/20 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-900/20 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#141416]/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-3xl font-extrabold text-transparent tracking-tight">
              FinSight AI
            </h1>
            <p className="mt-2 text-sm text-[#8c8c99]">Welcome back to your financial cockpit</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-center text-xs text-emerald-400">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-center text-xs text-red-400">
                {errorMessage}
              </div>
            )}

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
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1b5]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-indigo-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/5 bg-[#1a1a1e]/80 px-4 py-3 text-sm text-[#ededed] placeholder-[#5c5c6b] outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-[#1f1f25]"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg outline-none transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-[#8c8c99]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-indigo-400 hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f] text-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
