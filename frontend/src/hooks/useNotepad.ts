"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lumence:notepad";

// Local-only, silent autosave - no server persistence, no history, no
// per-day separation (Design/lumence-design-handoff.md). Reads from
// localStorage only after mount so SSR/client markup match on first paint.
export function useNotepad() {
  const [text, setText] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // one-time hydration from localStorage after mount - unavoidable for an
    // SSR-safe controlled textarea, not the "sync external store" case
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setText(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const id = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, text);
    }, 300);
    return () => window.clearTimeout(id);
  }, [text, isHydrated]);

  return { text, setText, isHydrated };
}
