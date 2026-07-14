import { Settings2 } from "lucide-react";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  onToggleGoalEditor: () => void;
}

export function AppHeader({ onToggleGoalEditor }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Дневник калорий</h1>
        <p className={styles.subtitle}>фото → оценка → журнал</p>
      </div>
      <button onClick={onToggleGoalEditor} className={styles.settingsButton} title="Настройки" aria-label="Настройки">
        <Settings2 size={16} className={styles.settingsIcon} />
      </button>
    </header>
  );
}
