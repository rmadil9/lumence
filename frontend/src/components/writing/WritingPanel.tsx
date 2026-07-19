"use client";

import { useState } from "react";

import { ChatPanel } from "./ChatPanel";
import { Notepad } from "./Notepad";

// Phase 4 adds the PublishBar beneath the autosave line.
export function WritingPanel() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col px-10 py-8">
      <Notepad onOpenChat={() => setIsChatOpen(true)} />
      <p className="mt-3 shrink-0 text-meta text-ink-muted">Autosaves silently</p>
      {isChatOpen ? <ChatPanel onClose={() => setIsChatOpen(false)} /> : null}
    </div>
  );
}
