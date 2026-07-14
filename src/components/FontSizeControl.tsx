import { Minus, Plus } from "lucide-react";
import styles from "./FontSizeControl.module.css";

interface FontSizeControlProps {
  scale: number;
  canIncrease: boolean;
  canDecrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function FontSizeControl({ scale, canIncrease, canDecrease, onIncrease, onDecrease }: FontSizeControlProps) {
  return (
    <div className={styles.editor}>
      <span className={styles.label}>Размер шрифта: {Math.round(scale * 100)}%</span>
      <div className={styles.buttons}>
        <button
          onClick={onDecrease}
          disabled={!canDecrease}
          className={styles.button}
          title="Уменьшить шрифт"
          aria-label="Уменьшить шрифт"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={onIncrease}
          disabled={!canIncrease}
          className={styles.button}
          title="Увеличить шрифт"
          aria-label="Увеличить шрифт"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
