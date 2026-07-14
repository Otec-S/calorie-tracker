import { X } from "lucide-react";
import styles from "./ErrorBanner.module.css";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <span className={styles.message}>{message}</span>
      <button onClick={onDismiss} className={styles.dismissButton} aria-label="Закрыть сообщение об ошибке">
        <X size={15} />
      </button>
    </div>
  );
}
