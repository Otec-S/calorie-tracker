import type { ChatMessage } from "../types.ts";

const KEY = "calorie-tracker:chat";

export interface StoredChatMessage extends ChatMessage {
  id: string;
  ts: string;
}

/** The chat is a single continuous thread that persists across sessions until explicitly cleared. */
export function loadChat(): StoredChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChat(messages: StoredChatMessage[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function clearChat(): void {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.error("Storage error:", e);
  }
}
