"use client";

import { useState } from "react";

import { useTodos } from "@/hooks/useTodos";
import { formatTodoAge } from "@/lib/todo-age";
import type { Todo } from "@/types/api";

export function TodoItem({ todo }: { todo: Todo }) {
  const { toggleStatus, updateTitle, updateDescription, deleteTodo } = useTodos();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(todo.title);
  const [isExpanded, setIsExpanded] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(todo.description ?? "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDone = todo.status === "done";
  const age = isDone ? null : formatTodoAge(todo.created_at);

  function commitTitle() {
    const trimmed = titleDraft.trim();
    setIsEditingTitle(false);
    if (trimmed && trimmed !== todo.title) {
      updateTitle(todo.id, trimmed);
    } else {
      setTitleDraft(todo.title);
    }
  }

  function revertTitle() {
    setTitleDraft(todo.title);
    setIsEditingTitle(false);
  }

  function commitDescription() {
    if (descriptionDraft !== (todo.description ?? "")) {
      updateDescription(todo.id, descriptionDraft);
    }
  }

  if (isConfirmingDelete) {
    return (
      <li className="flex items-center justify-between rounded bg-hover px-2 py-2">
        <span className="text-task text-ink">Delete this task?</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(false)}
            className="rounded px-2 py-1 text-meta text-ink-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleteTodo(todo.id)}
            className="rounded px-2 py-1 text-meta text-red-600"
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex flex-col rounded">
      <div className="flex items-center gap-2 rounded px-2 py-2 transition-colors duration-[120ms] hover:bg-hover">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-label={isExpanded ? "Collapse description" : "Expand description"}
          className="shrink-0 text-ink-muted"
        >
          {isExpanded ? "▾" : "▸"}
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={isDone ? "Mark as not done" : "Mark as done"}
          onClick={() => toggleStatus(todo)}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none text-white ${
            isDone ? "border-accent bg-accent" : "border-hairline"
          }`}
        >
          {isDone ? "✓" : null}
        </button>

        {isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") revertTitle();
            }}
            className="min-w-0 flex-1 rounded border border-transparent bg-transparent text-task text-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            className={`min-w-0 flex-1 truncate text-left text-task ${
              isDone ? "text-ink-muted line-through" : "text-ink"
            }`}
          >
            {todo.title}
            {todo.description ? (
              <span aria-hidden className="ml-1.5 text-ink-muted">
                ▤
              </span>
            ) : null}
          </button>
        )}

        {age ? (
          <span className="shrink-0 rounded-full border border-hairline px-1.5 text-meta text-ink-soft">
            {age}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          aria-label="Delete task"
          className="shrink-0 text-ink-muted opacity-40 transition-opacity duration-[120ms] md:opacity-0 md:group-hover:opacity-100"
        >
          🗑
        </button>
      </div>

      {isExpanded ? (
        <textarea
          autoFocus={!todo.description}
          value={descriptionDraft}
          onChange={(e) => setDescriptionDraft(e.target.value)}
          onBlur={commitDescription}
          placeholder="Add a description"
          rows={2}
          className="ml-11 mb-1 resize-none border-none bg-transparent text-task text-ink-soft outline-none placeholder:text-ink-muted"
        />
      ) : null}
    </li>
  );
}
