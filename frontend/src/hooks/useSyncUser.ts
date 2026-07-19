"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";

// POST /users/sync ensures the local `users` row exists before any other
// backend call - those 404 with "user not synced" otherwise (see
// backend/app/auth.py get_current_user). staleTime: Infinity because syncing
// twice in a session is wasted work - the row won't disappear mid-session.
export function useSyncUser() {
  const api = useApiClient();

  return useQuery({
    queryKey: ["user-sync"],
    queryFn: () => api.syncUser(),
    staleTime: Infinity,
    retry: 2,
  });
}
