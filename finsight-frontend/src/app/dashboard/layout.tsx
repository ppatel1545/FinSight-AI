"use client";

import RouteGuard from "@/components/routeGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
