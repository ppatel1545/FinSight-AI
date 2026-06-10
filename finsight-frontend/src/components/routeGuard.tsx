"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkAuth = () => {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };

    // Small delay to ensure Zustand rehydrates state from localStorage
    const timeout = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, router]);

  // Premium glassmorphic loading screen during the auth check
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent"></div>
          <p className="animate-pulse font-mono text-sm tracking-widest text-indigo-300">
            SECURELY LOADING...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
