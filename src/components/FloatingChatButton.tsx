import { MessageCircle } from "lucide-react";
import styles from "./FloatingChatButton.module.css";

interface FloatingChatButtonProps {
  onClick: () => void;
}

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <button onClick={onClick} className={styles.button} title="Спросить нутрициолога" aria-label="Открыть чат с нутрициологом">
      <MessageCircle size={22} />
    </button>
  );
}
