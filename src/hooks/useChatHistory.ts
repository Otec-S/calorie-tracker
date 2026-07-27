import { useCallback, useEffect, useState } from "react";
import { sendChatMessage } from "../api/claude.ts";
import { clearChat, loadChat, saveChat, type StoredChatMessage } from "../storage/chatStorage.ts";
import { loadAllDayKeys, loadDay } from "../storage/entriesStorage.ts";
import { todayKey } from "../utils/date.ts";
import type { ChatAttachment, ChatMessage, Entry } from "../types.ts";

// Only the tail of the thread is sent to the model each turn — keeps token
// cost and latency bounded even as the persisted thread grows unbounded.
const HISTORY_LIMIT = 10;
const CONTEXT_DAYS = 7;

export type ChatStatus = "idle" | "sending" | "error";

function makeId(): string {
  return Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

/** Reads today + the most recent CONTEXT_DAYS-1 days from storage, freshly on every send. */
function recentDays(): Record<string, Entry[]> {
  const tKey = todayKey();
  const keys = loadAllDayKeys();
  const allKeys = keys.includes(tKey) ? keys : [tKey, ...keys];
  const days: Record<string, Entry[]> = {};
  for (const k of allKeys.slice(0, CONTEXT_DAYS)) days[k] = loadDay(k);
  return days;
}

/**
 * Owns the diet-planning chat thread: a single continuous conversation
 * persisted in storage across sessions, sent to the backend alongside a
 * fresh snapshot of the last week's food log on every message.
 */
export function useChatHistory(goal: number) {
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages(loadChat());
  }, []);

  const sendMessage = useCallback(
    async (text: string, attachments?: ChatAttachment[]) => {
      const userMsg: StoredChatMessage = {
        id: makeId(),
        role: "user",
        content: text,
        attachments,
        ts: new Date().toISOString(),
      };
      const withUser = [...messages, userMsg];
      setMessages(withUser);
      saveChat(withUser);
      setStatus("sending");
      setError("");

      try {
        const history: ChatMessage[] = withUser
          .slice(-HISTORY_LIMIT)
          .map(({ role, content, attachments }) => ({ role, content, attachments }));
        const reply = await sendChatMessage(history, recentDays(), goal);
        const assistantMsg: StoredChatMessage = {
          id: makeId(),
          role: "assistant",
          content: reply,
          ts: new Date().toISOString(),
        };
        const withReply = [...withUser, assistantMsg];
        setMessages(withReply);
        saveChat(withReply);
        setStatus("idle");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Не получилось отправить сообщение");
        setStatus("error");
      }
    },
    [messages, goal],
  );

  const clear = useCallback(() => {
    clearChat();
    setMessages([]);
    setStatus("idle");
    setError("");
  }, []);

  return { messages, status, error, sendMessage, clear };
}
