import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2, X } from "lucide-react";
import styles from "./DietChat.module.css";
import { useChatHistory } from "../hooks/useChatHistory.ts";

interface DietChatProps {
  goal: number;
  onClose: () => void;
}

export function DietChat({ goal, onClose }: DietChatProps) {
  const { messages, status, error, sendMessage, clear } = useChatHistory(goal);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "sending") return;
    setInput("");
    void sendMessage(text);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Чат с нутрициологом">
      <header className={styles.header}>
        <h2 className={styles.title}>Нутрициолог</h2>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button onClick={clear} className={styles.iconButton} title="Очистить чат" aria-label="Очистить чат">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className={styles.iconButton} title="Закрыть" aria-label="Закрыть чат">
            <X size={18} />
          </button>
        </div>
      </header>

      <div className={styles.messages} ref={listRef}>
        {messages.length === 0 && (
          <p className={styles.placeholder}>
            Спроси что-нибудь о своём рационе — например, «сколько ещё можно съесть сегодня?» или «что взять на ужин,
            чтобы уложиться в цель?». Я вижу твои записи за сегодня и последнюю неделю.
          </p>
        )}
        <ul className={styles.list}>
          {messages.map((m) => (
            <li key={m.id} className={m.role === "user" ? styles.userBubble : styles.assistantBubble}>
              {m.content}
            </li>
          ))}
          {status === "sending" && (
            <li className={styles.assistantBubble}>
              <Loader2 size={14} className="spin" />
            </li>
          )}
        </ul>
      </div>

      {status === "error" && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.inputRow}>
        <label htmlFor="diet-chat-input" className={styles.srOnly}>
          Сообщение нутрициологу
        </label>
        <input
          id="diet-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши сообщение…"
          className={styles.input}
          disabled={status === "sending"}
          autoFocus
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={status === "sending" || !input.trim()}
          aria-label="Отправить"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
