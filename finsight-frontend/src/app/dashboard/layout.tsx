"use client";

import RouteGuard from "@/components/routeGuard";
import ChatAssistant from "@/components/chatAssistant";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      {children}
      <ChatAssistant />
    </RouteGuard>
  );
}

