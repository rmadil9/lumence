// Phase 1: static shell only. Phase 3 adds Notepad/ChatPanel, Phase 4 the PublishBar.
export function WritingPanel() {
  return (
    <div className="flex w-full flex-col px-10 py-8">
      <p className="flex-1 text-scratchpad text-ink-muted">Start writing</p>
      <p className="mt-3 text-meta text-ink-muted">Autosaves silently</p>
    </div>
  );
}
