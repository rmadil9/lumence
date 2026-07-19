"use client";

import { useState } from "react";

import type { Todo } from "@/types/api";

import { TodoItem } from "./TodoItem";

export function TodoList({ todos }: { todos: Todo[] }) {
  const [showDone, setShowDone] = useState(false);

  const open = todos.filter((t) => t.status === "todo");
  const done = todos.filter((t) => t.status === "done");

  if (open.length === 0 && done.length === 0) {
    return <p className="text-task text-ink-muted">No tasks yet</p>;
  }

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col gap-0.5">
        {open.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>

      {done.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="mt-6 flex items-center gap-1.5 self-start px-2 py-1 text-meta text-ink-soft"
          >
            <span aria-hidden>{showDone ? "▾" : "▸"}</span>
            Done <span className="tabular-nums">{done.length}</span>
          </button>
          {showDone ? (
            <ul className="mt-1 flex flex-col gap-0.5">
              {done.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
