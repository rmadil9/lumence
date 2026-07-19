"use client";

import { useNotepad } from "@/hooks/useNotepad";

export function Notepad({ onOpenChat }: { onOpenChat: () => void }) {
  const { text, setText, isHydrated } = useNotepad();

  return (
    <div className="relative min-h-0 flex-1">
      <textarea
        value={isHydrated ? text : ""}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing"
        className="h-full w-full resize-none border-none bg-transparent text-scratchpad text-ink/90 outline-none placeholder:text-ink-muted"
      />
      <button
        type="button"
        onClick={onOpenChat}
        className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border border-hairline bg-surface/80 px-3 py-1.5 text-meta text-ink-soft"
      >
        <span aria-hidden>✦</span> Chat
      </button>
    </div>
  );
}
