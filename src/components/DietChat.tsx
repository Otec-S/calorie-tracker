import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Send, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./DietChat.module.css";
import { useChatHistory } from "../hooks/useChatHistory.ts";
import { fileToAttachment } from "../utils/attachments.ts";
import type { ChatAttachment } from "../types.ts";

interface DietChatProps {
  goal: number;
  onClose: () => void;
}

const MAX_ATTACHMENTS = 4;

export function DietChat({ goal, onClose }: DietChatProps) {
  const { messages, status, error, sendMessage, clear } = useChatHistory(goal);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachError, setAttachError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setAttachError("");
    const room = MAX_ATTACHMENTS - attachments.length;
    if (files.length > room) {
      setAttachError(`Можно приложить не больше ${MAX_ATTACHMENTS} файлов за раз`);
    }
    const toAdd = files.slice(0, Math.max(room, 0));

    const converted: ChatAttachment[] = [];
    for (const file of toAdd) {
      try {
        converted.push(await fileToAttachment(file));
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : "Не удалось прочитать файл");
      }
    }
    if (converted.length > 0) setAttachments((prev) => [...prev, ...converted]);
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && attachments.length === 0) || status === "sending") return;
    setInput("");
    setAttachments([]);
    setAttachError("");
    void sendMessage(text, attachments.length > 0 ? attachments : undefined);
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
          {messages.map((m) =>
            m.role === "user" ? (
              <li key={m.id} className={styles.userBubble}>
                {m.attachments && m.attachments.length > 0 && (
                  <ul className={styles.attachmentStrip}>
                    {m.attachments.map((a, i) => (
                      <li key={i}>
                        <AttachmentThumb attachment={a} />
                      </li>
                    ))}
                  </ul>
                )}
                {m.content}
              </li>
            ) : (
              <li key={m.id} className={`${styles.assistantBubble} ${styles.markdown}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </li>
            ),
          )}
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

      {attachError && (
        <div role="alert" className={styles.error}>
          {attachError}
        </div>
      )}

      {attachments.length > 0 && (
        <ul className={styles.pendingAttachments}>
          {attachments.map((a, i) => (
            <li key={i} className={styles.pendingAttachment}>
              <AttachmentThumb attachment={a} />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className={styles.removeAttachment}
                aria-label={`Убрать файл ${a.name}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className={styles.inputRow}>
        <label htmlFor="diet-chat-input" className={styles.srOnly}>
          Сообщение нутрициологу
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFilesSelected}
          className={styles.hiddenInput}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.attachButton}
          disabled={status === "sending" || attachments.length >= MAX_ATTACHMENTS}
          title="Приложить фото или файл"
          aria-label="Приложить фото или файл"
        >
          <Paperclip size={18} />
        </button>
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
          disabled={status === "sending" || (!input.trim() && attachments.length === 0)}
          aria-label="Отправить"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function AttachmentThumb({ attachment }: { attachment: ChatAttachment }) {
  if (attachment.mediaType === "application/pdf") {
    return (
      <span className={styles.fileChip} title={attachment.name}>
        <FileText size={16} />
        <span className={styles.fileChipName}>{attachment.name}</span>
      </span>
    );
  }
  return (
    <img
      src={`data:${attachment.mediaType};base64,${attachment.base64}`}
      alt={attachment.name}
      className={styles.attachmentThumb}
    />
  );
}
