"use client";

import { useSyncUser } from "@/hooks/useSyncUser";

import { AppLayout } from "./AppLayout";

// Gates the protected area on /users/sync succeeding first - every other
// backend call 404s until the local `users` row exists.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isPending, isError } = useSyncUser();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <p className="text-meta text-ink-muted">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <p className="text-meta text-ink-muted">
          Something went wrong. Try refreshing.
        </p>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
