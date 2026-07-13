import { X } from "lucide-react";
import styles from "./ErrorBanner.module.css";

/**
 * @param {{ message: string, onDismiss: () => void }} props
 */
export function ErrorBanner({ message, onDismiss }) {
  return (
    <div className={styles.banner}>
      <span className={styles.message}>{message}</span>
      <button onClick={onDismiss} className={styles.dismissButton}>
        <X size={15} />
      </button>
    </div>
  );
}
