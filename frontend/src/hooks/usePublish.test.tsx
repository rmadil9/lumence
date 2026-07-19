import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePublish } from "./usePublish";

const api = {
  getStreak: vi.fn(),
  markPublished: vi.fn(),
};

vi.mock("@/hooks/useApiClient", () => ({
  useApiClient: () => api,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePublish", () => {
  it("reflects already_published_today from the streak query", async () => {
    api.getStreak.mockResolvedValue({ streak: 4, already_published_today: false });

    const { result } = renderHook(() => usePublish(), { wrapper });
    await waitFor(() => expect(result.current.hasPublishedToday).toBe(false));
  });

  it("flips to published after a successful markPublished call, even though the backend's already_published_today means 'was already published before this call'", async () => {
    api.getStreak.mockResolvedValue({ streak: 4, already_published_today: false });
    // a fresh first-time-today publish correctly returns false here -
    // it describes the pre-call state, not the post-call result
    api.markPublished.mockResolvedValue({ streak: 5, already_published_today: false });

    const { result } = renderHook(() => usePublish(), { wrapper });
    await waitFor(() => expect(result.current.hasPublishedToday).toBe(false));

    act(() => {
      result.current.markPublished();
    });

    await waitFor(() => expect(result.current.hasPublishedToday).toBe(true));
  });
});
