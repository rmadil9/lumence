"use client";

import { useState } from "react";

import { useNotepad } from "@/hooks/useNotepad";

import { ChatPanel } from "./ChatPanel";
import { Notepad } from "./Notepad";
import { PublishBar } from "./PublishBar";

export function WritingPanel() {
  // lifted here (not inside Notepad) so PublishBar can read the same live
  // text for the X character counter
  const { text, setText, isHydrated } = useNotepad();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col px-10 py-8">
      <Notepad
        text={text}
        setText={setText}
        isHydrated={isHydrated}
        onOpenChat={() => setIsChatOpen(true)}
      />
      <p className="mt-3 shrink-0 text-meta text-ink-muted">Autosaves silently</p>
      <PublishBar text={text} />
      {isChatOpen ? <ChatPanel onClose={() => setIsChatOpen(false)} /> : null}
    </div>
  );
}
