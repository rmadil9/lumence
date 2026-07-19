"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";

export function UsageBadge() {
  const api = useApiClient();
  const { data } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.getUsage(),
  });

  return (
    <span className="flex items-center gap-1.5 text-meta text-ink-soft tabular-nums">
      <span aria-hidden>✦</span>
      {data ? `${data.used_today} / ${data.limit}` : "– / –"}
    </span>
  );
}
