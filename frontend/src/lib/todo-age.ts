// Age badge only appears on rolled-forward (still-open) tasks, per
// Design/lumence-design-handoff.md - days since creation, in calendar days.
export function formatTodoAge(createdAt: string, now: Date = new Date()): string | null {
  const created = new Date(createdAt);
  const createdMidnight = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate(),
  );
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round(
    (nowMidnight.getTime() - createdMidnight.getTime()) / 86_400_000,
  );

  if (days <= 0) return null;
  if (days < 14) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
