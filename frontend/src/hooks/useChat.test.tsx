import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChat } from "./useChat";

const api = {
  getUsage: vi.fn(),
  chat: vi.fn(),
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

describe("useChat", () => {
  it("is not exhausted while under the daily limit", async () => {
    api.getUsage.mockResolvedValue({ used_today: 3, limit: 10 });

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.usage).toBeDefined());

    expect(result.current.isExhausted).toBe(false);
  });

  it("is exhausted once used_today reaches the limit", async () => {
    api.getUsage.mockResolvedValue({ used_today: 10, limit: 10 });

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.usage).toBeDefined());

    expect(result.current.isExhausted).toBe(true);
  });

  it("appends the user message immediately, then the assistant reply on success", async () => {
    api.getUsage.mockResolvedValue({ used_today: 0, limit: 10 });
    let resolveChat!: (reply: { reply: string }) => void;
    api.chat.mockReturnValue(
      new Promise((resolve) => {
        resolveChat = resolve;
      }),
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.usage).toBeDefined());

    act(() => {
      result.current.sendMessage("polish this");
    });
    expect(result.current.messages).toEqual([
      { role: "user", content: "polish this" },
    ]);

    await act(async () => {
      resolveChat({ reply: "here's a tighter version" });
    });

    await waitFor(() =>
      expect(result.current.messages).toEqual([
        { role: "user", content: "polish this" },
        { role: "assistant", content: "here's a tighter version" },
      ]),
    );
  });
});
