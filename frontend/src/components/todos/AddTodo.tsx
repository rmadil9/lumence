"use client";

import { useState } from "react";

import { useTodos } from "@/hooks/useTodos";

export function AddTodo({ autoFocus = false }: { autoFocus?: boolean }) {
  const { addTodo } = useTodos();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    addTodo(title);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-4 mt-5">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
      >
        +
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task"
        autoFocus={autoFocus}
        className="h-10 w-full rounded-control border border-hairline bg-transparent pl-9 pr-3 text-task text-ink outline-none focus:ring-2 focus:ring-accent"
      />
    </form>
  );
}
