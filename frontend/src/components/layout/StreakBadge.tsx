"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";

export function StreakBadge() {
  const api = useApiClient();
  const { data } = useQuery({
    queryKey: ["streak"],
    queryFn: () => api.getStreak(),
  });

  return (
    <span className="flex items-center gap-1.5 text-meta text-ink-soft tabular-nums">
      <span aria-hidden>🔥</span>
      {data?.streak ?? "–"}
    </span>
  );
}
