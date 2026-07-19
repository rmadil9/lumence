"use client";

import { UserButton } from "@clerk/nextjs";

import { StreakBadge } from "./StreakBadge";
import { UsageBadge } from "./UsageBadge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline px-8">
        <span className="text-[17px] font-medium tracking-tight text-ink">
          Lumence
        </span>
        <div className="flex items-center gap-6">
          <StreakBadge />
          <UsageBadge />
          <UserButton />
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
