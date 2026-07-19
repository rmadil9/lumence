import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Todo } from "@/types/api";

import { useTodos } from "./useTodos";

const api = {
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

vi.mock("@/hooks/useApiClient", () => ({
  useApiClient: () => api,
}));

const baseTodo: Todo = {
  id: 1,
  user_id: 1,
  title: "write post",
  description: null,
  status: "todo",
  created_at: "2026-07-19T00:00:00",
  completed_at: null,
};

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
  api.listTodos.mockResolvedValue([baseTodo]);
});

describe("useTodos", () => {
  it("optimistically flips status before the request resolves", async () => {
    let resolveUpdate!: (todo: Todo) => void;
    api.updateTodo.mockReturnValue(
      new Promise<Todo>((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    const { result } = renderHook(() => useTodos(), { wrapper });
    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    act(() => {
      result.current.toggleStatus(baseTodo);
    });

    // optimistic flip lands before the mutation resolves - resolveUpdate
    // hasn't been called yet at this point
    await waitFor(() => expect(result.current.todos[0].status).toBe("done"));

    await act(async () => {
      resolveUpdate({ ...baseTodo, status: "done" });
    });

    expect(result.current.todos[0].status).toBe("done");
  });

  it("rolls back the optimistic change when the request fails", async () => {
    let rejectUpdate!: (err: Error) => void;
    api.updateTodo.mockReturnValue(
      new Promise<Todo>((_resolve, reject) => {
        rejectUpdate = reject;
      }),
    );

    const { result } = renderHook(() => useTodos(), { wrapper });
    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    act(() => {
      result.current.toggleStatus(baseTodo);
    });
    await waitFor(() => expect(result.current.todos[0].status).toBe("done"));

    await act(async () => {
      rejectUpdate(new Error("network error"));
      // let the rejected promise's rollback handler run without failing the test
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() => expect(result.current.todos[0].status).toBe("todo"));
  });

  it("optimistically appends a new todo, then swaps in the server response", async () => {
    const created: Todo = { ...baseTodo, id: 2, title: "new task" };
    api.createTodo.mockResolvedValue(created);

    const { result } = renderHook(() => useTodos(), { wrapper });
    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    act(() => {
      result.current.addTodo("new task");
    });
    await waitFor(() => expect(result.current.todos).toHaveLength(2));
    expect(result.current.todos[1].title).toBe("new task");

    await waitFor(() =>
      expect(result.current.todos.some((t) => t.id === 2)).toBe(true),
    );
  });
});
