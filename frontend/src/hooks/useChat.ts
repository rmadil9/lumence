"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/hooks/useApiClient";
import type { ChatMessage } from "@/types/api";

// Context-free by design: only the conversation itself is sent, never the
// scratchpad - see Design/lumence-design-handoff.md ("automatic AI context
// passing" is explicitly out of scope). Not persisted anywhere (server or
// local) - matches the backend, which never stores chat history either.
export function useChat() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const usageQuery = useQuery({ queryKey: ["usage"], queryFn: () => api.getUsage() });

  const sendMutation = useMutation({
    mutationFn: (nextMessages: ChatMessage[]) => api.chat({ messages: nextMessages }),
    onSuccess: (res, nextMessages) => {
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
  });

  function sendMessage(content: string) {
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    sendMutation.mutate(next);
  }

  const usage = usageQuery.data;
  const isExhausted = usage ? usage.used_today >= usage.limit : false;

  return {
    messages,
    sendMessage,
    isSending: sendMutation.isPending,
    isError: sendMutation.isError,
    isExhausted,
    usage,
  };
}
