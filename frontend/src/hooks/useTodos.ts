"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/useApiClient";
import type { Todo, TodoUpdate } from "@/types/api";

const TODOS_KEY = ["todos"];

// Centralizes all /todos reads+writes so TodoPanel/TodoList/TodoItem/AddTodo
// stay presentational. Every mutation applies optimistically against the
// ['todos'] cache and rolls back on error - no broad invalidateQueries, so
// concurrent edits to different todos don't clobber each other's optimistic
// state. (Two rapid edits to the *same* todo can still race on rollback -
// acceptable for a single-user app, not worth a mutation queue for V1.)
export function useTodos() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: TODOS_KEY, queryFn: () => api.listTodos() });

  async function withOptimisticUpdate(updater: (old: Todo[]) => Todo[]) {
    await queryClient.cancelQueries({ queryKey: TODOS_KEY });
    const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY);
    queryClient.setQueryData<Todo[]>(TODOS_KEY, (old = []) => updater(old));
    return { previous };
  }

  function rollback(context: { previous?: Todo[] } | undefined) {
    if (context?.previous) {
      queryClient.setQueryData(TODOS_KEY, context.previous);
    }
  }

  const addTodoMutation = useMutation({
    mutationFn: (title: string) => api.createTodo({ title }),
    onMutate: async (title) => {
      const tempId = -Date.now();
      const { previous } = await withOptimisticUpdate((old) => [
        ...old,
        {
          id: tempId,
          user_id: 0,
          title,
          description: null,
          status: "todo",
          created_at: new Date().toISOString(),
          completed_at: null,
        },
      ]);
      return { previous, tempId };
    },
    onError: (_err, _title, context) => rollback(context),
    onSuccess: (created, _title, context) => {
      queryClient.setQueryData<Todo[]>(TODOS_KEY, (old = []) =>
        old.map((t) => (t.id === context?.tempId ? created : t)),
      );
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TodoUpdate }) =>
      api.updateTodo(id, payload),
    onMutate: async ({ id, payload }) =>
      withOptimisticUpdate((old) =>
        old.map((t) => (t.id === id ? { ...t, ...payload } : t)),
      ),
    onError: (_err, _vars, context) => rollback(context),
    onSuccess: (updated) => {
      queryClient.setQueryData<Todo[]>(TODOS_KEY, (old = []) =>
        old.map((t) => (t.id === updated.id ? updated : t)),
      );
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => api.deleteTodo(id),
    onMutate: async (id) =>
      withOptimisticUpdate((old) => old.filter((t) => t.id !== id)),
    onError: (_err, _id, context) => rollback(context),
  });

  return {
    todos: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    addTodo: (title: string) => addTodoMutation.mutate(title),
    toggleStatus: (todo: Todo) =>
      updateTodoMutation.mutate({
        id: todo.id,
        payload: { status: todo.status === "todo" ? "done" : "todo" },
      }),
    updateTitle: (id: number, title: string) =>
      updateTodoMutation.mutate({ id, payload: { title } }),
    updateDescription: (id: number, description: string) =>
      updateTodoMutation.mutate({ id, payload: { description } }),
    deleteTodo: (id: number) => deleteTodoMutation.mutate(id),
  };
}
