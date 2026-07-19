"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useChat } from "@/hooks/useChat";

// Markdown wrapper: strong maps to font-medium (not bold) to stay inside the
// design system's "weights 400/500 only" rule even for AI-authored content.
const MARKDOWN_CLASSES =
  "text-task text-ink [&_strong]:font-medium [&_a]:underline [&_p+p]:mt-2 " +
  "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 " +
  "[&_code]:rounded [&_code]:bg-hover [&_code]:px-1 [&_code]:text-meta " +
  "[&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-hover [&_pre]:p-2";

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, isSending, isError, isExhausted, usage } = useChat();
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || isExhausted || isSending) return;
    sendMessage(content);
    setInput("");
  }

  const quotaLine = usage
    ? isExhausted
      ? `0 of ${usage.limit} left today, resets tomorrow`
      : `${usage.limit - usage.used_today} of ${usage.limit} left today`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface md:inset-y-0 md:left-auto md:right-0 md:top-16 md:w-[340px] md:border-l md:border-hairline">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-hairline px-4">
        <span className="flex items-center gap-1.5 text-task text-ink">
          <span aria-hidden>✦</span> Chat
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="text-ink-soft"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="max-w-[85%] self-end rounded-2xl rounded-br-sm border border-accent/20 bg-accent/10 px-3 py-2 text-task text-ink"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[85%] self-start rounded-2xl rounded-bl-sm border border-hairline px-3 py-2"
            >
              <div className={MARKDOWN_CLASSES}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(m.content)}
                className="mt-2 flex items-center gap-1 text-meta text-ink-soft"
              >
                <span aria-hidden>⧉</span> Copy
              </button>
            </div>
          ),
        )}
        {isExhausted ? (
          <p className="text-meta text-ink-muted">
            You&apos;ve used all of today&apos;s AI messages — your limit resets
            tomorrow.
          </p>
        ) : null}
        {isError ? (
          <p className="text-meta text-ink-muted">
            Something went wrong. Try again.
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-hairline p-3">
        <div
          className={`flex items-end gap-2 rounded-control border border-hairline px-3 py-2 focus-within:border-focus-ring-border focus-within:ring-2 focus-within:ring-focus-ring ${
            isExhausted ? "opacity-60" : ""
          }`}
        >
          <textarea
            autoFocus={!isExhausted}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isExhausted ? "Daily limit reached" : "Message…"}
            disabled={isExhausted}
            className="flex-1 resize-none bg-transparent text-task text-ink outline-none focus-visible:shadow-none disabled:placeholder:text-ink-muted"
          />
          <button
            type="submit"
            disabled={isExhausted || !input.trim() || isSending}
            aria-label="Send"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
          >
            ↑
          </button>
        </div>
        {quotaLine ? (
          <p className="mt-2 px-1 text-meta text-ink-muted">{quotaLine}</p>
        ) : null}
      </form>
    </div>
  );
}
