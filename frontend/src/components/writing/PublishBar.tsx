"use client";

import { useState } from "react";

import { usePublish } from "@/hooks/usePublish";

const X_LIMIT = 280;

export function PublishBar({ text }: { text: string }) {
  const [xOn, setXOn] = useState(true);
  const [linkedinOn, setLinkedinOn] = useState(false);
  const { hasPublishedToday, markPublished, isPublishing } = usePublish();

  const count = text.length;
  const isOverLimit = count > X_LIMIT;

  function handlePostToX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCopyForLinkedIn() {
    navigator.clipboard.writeText(text);
    window.open("https://www.linkedin.com/feed/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-4 flex shrink-0 flex-wrap items-center gap-4 border-t border-hairline pt-4">
      <button
        type="button"
        onClick={() => setXOn((v) => !v)}
        aria-pressed={xOn}
        aria-label="Toggle X as a publish target"
        className={`rounded-full border px-3.5 py-1.5 text-meta ${
          xOn
            ? "border-ink/80 bg-black/[0.04] text-ink"
            : "border-hairline text-ink-soft"
        }`}
      >
        <span aria-hidden>𝕏</span>
      </button>
      <button
        type="button"
        onClick={() => setLinkedinOn((v) => !v)}
        aria-pressed={linkedinOn}
        aria-label="Toggle LinkedIn as a publish target"
        className={`rounded-full border px-3.5 py-1.5 text-meta ${
          linkedinOn
            ? "border-ink/80 bg-black/[0.04] text-ink"
            : "border-hairline text-ink-soft"
        }`}
      >
        in LinkedIn
      </button>

      {xOn ? (
        <span
          className={`tabular-nums text-meta ${
            isOverLimit ? "text-warning" : "text-ink-soft"
          }`}
        >
          {count} / {X_LIMIT}
        </span>
      ) : null}

      <span className="flex-1" />

      {xOn ? (
        <button
          type="button"
          onClick={handlePostToX}
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-meta text-white"
        >
          <span aria-hidden>𝕏</span> Post to X ↗
        </button>
      ) : null}

      {linkedinOn ? (
        <button
          type="button"
          onClick={handleCopyForLinkedIn}
          className="flex items-center gap-1.5 rounded-full border border-hairline px-4 py-1.5 text-meta text-ink-soft"
        >
          in Copy for LinkedIn
        </button>
      ) : null}

      {hasPublishedToday ? (
        <span className="flex items-center gap-1.5 px-2 py-1.5 text-meta text-emerald-600">
          <span aria-hidden>✓</span> Published today
        </span>
      ) : (
        <button
          type="button"
          onClick={() => markPublished()}
          disabled={isPublishing}
          className="flex items-center gap-1.5 rounded-full border border-hairline px-4 py-1.5 text-meta text-ink-soft disabled:opacity-50"
        >
          <span aria-hidden>✓</span> Mark as published
        </button>
      )}
    </div>
  );
}
