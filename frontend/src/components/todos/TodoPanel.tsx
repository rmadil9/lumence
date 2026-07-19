// Phase 1: static shell only. Phase 2 adds AddTodo + TodoList here.
export function TodoPanel() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex w-full flex-col px-8 py-7">
      <h1 className="text-2xl font-medium text-ink">Today</h1>
      <p className="text-meta text-ink-soft">{today}</p>
      <p className="mt-5 text-task text-ink-muted">No tasks yet</p>
    </div>
  );
}
