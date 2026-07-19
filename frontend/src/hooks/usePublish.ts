"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";

// Shares the ["streak"] cache with StreakBadge (header chip) - a successful
// publish updates both in sync without a second round-trip.
export function usePublish() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const streakQuery = useQuery({ queryKey: ["streak"], queryFn: () => api.getStreak() });

  const publishMutation = useMutation({
    mutationFn: () => api.markPublished(),
    onSuccess: (res) => {
      // res.already_published_today means "was it already published *before*
      // this call" (used server-side to no-op the streak bump) - from the
      // UI's perspective, any successful call means today IS published now.
      queryClient.setQueryData(["streak"], { ...res, already_published_today: true });
    },
  });

  return {
    hasPublishedToday: streakQuery.data?.already_published_today ?? false,
    markPublished: () => publishMutation.mutate(),
    isPublishing: publishMutation.isPending,
  };
}
