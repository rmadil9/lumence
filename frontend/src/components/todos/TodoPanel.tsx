"use client";

import { useTodos } from "@/hooks/useTodos";

import { AddTodo } from "./AddTodo";
import { TodoList } from "./TodoList";

export function TodoPanel() {
  const { todos, isLoading } = useTodos();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex w-full flex-col overflow-y-auto px-8 py-7">
      <h1 className="text-2xl font-medium text-ink">Today</h1>
      <p className="text-meta text-ink-soft">{today}</p>
      <AddTodo autoFocus={!isLoading && todos.length === 0} />
      {isLoading ? (
        <p className="text-task text-ink-muted">Loading…</p>
      ) : (
        <TodoList todos={todos} />
      )}
    </div>
  );
}
