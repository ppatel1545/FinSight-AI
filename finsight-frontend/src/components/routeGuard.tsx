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
    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }, 120);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, router]);

  if (!mounted || loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d0f",
        }}
      >
        <style>{`
          @keyframes rg-spin  { to { transform: rotate(360deg); } }
          @keyframes rg-ping  { 75%,100% { transform: scale(1.8); opacity: 0; } }
          @keyframes rg-dot   { from { transform: translateY(0); opacity:.4; } to { transform: translateY(-8px); opacity:1; } }
          @keyframes rg-fadein{ from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        `}</style>

        {/* Subtle background glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "400px", height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Spinner */}
        <div style={{ position: "relative", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "28px" }}>
          <span style={{
            position: "absolute", width: "72px", height: "72px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.12)",
            animation: "rg-ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
          }} />
          <span style={{
            width: "52px", height: "52px", borderRadius: "50%",
            border: "3px solid rgba(99,102,241,0.2)",
            borderTopColor: "#818cf8",
            borderRightColor: "#a78bfa",
            animation: "rg-spin 0.9s linear infinite",
            display: "block",
          }} />
        </div>

        {/* Brand */}
        <p style={{
          background: "linear-gradient(135deg, #818cf8, #a78bfa, #f472b6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: "20px", fontWeight: 800,
          letterSpacing: "0.04em",
          marginBottom: "6px",
          animation: "rg-fadein 0.5s ease both",
        }}>
          FinSight AI
        </p>
        <p style={{
          color: "#8c8c99", fontSize: "11px",
          letterSpacing: "0.15em", textTransform: "uppercase",
          marginBottom: "28px",
          animation: "rg-fadein 0.6s ease both",
        }}>
          Securing your session…
        </p>

        {/* Bouncing dots */}
        <div style={{ display: "flex", gap: "7px" }}>
          {[
            { color: "#818cf8", delay: "0ms" },
            { color: "#a78bfa", delay: "140ms" },
            { color: "#f472b6", delay: "280ms" },
          ].map((d, i) => (
            <span key={i} style={{
              width: "6px", height: "6px", borderRadius: "50%",
              backgroundColor: d.color, display: "inline-block",
              animation: "rg-dot 0.65s ease-in-out infinite alternate",
              animationDelay: d.delay,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
