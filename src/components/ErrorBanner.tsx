import { X } from "lucide-react";
import styles from "./ErrorBanner.module.css";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className={styles.banner}>
      <span className={styles.message}>{message}</span>
      <button onClick={onDismiss} className={styles.dismissButton}>
        <X size={15} />
      </button>
    </div>
  );
}
