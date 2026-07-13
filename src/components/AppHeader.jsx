import { Settings2 } from "lucide-react";
import styles from "./AppHeader.module.css";

/**
 * @param {{ onToggleGoalEditor: () => void }} props
 */
export function AppHeader({ onToggleGoalEditor }) {
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.title}>Дневник калорий</div>
        <div className={styles.subtitle}>фото → оценка → журнал</div>
      </div>
      <button onClick={onToggleGoalEditor} className={styles.settingsButton} title="Изменить дневную цель">
        <Settings2 size={16} className={styles.settingsIcon} />
      </button>
    </div>
  );
}
