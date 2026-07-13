import styles from "./GoalEditor.module.css";

/**
 * @param {{ goal: number, onSave: (rawValue: string) => void }} props
 */
export function GoalEditor({ goal, onSave }) {
  return (
    <div className={styles.editor}>
      <span className={styles.label}>Дневная цель, ккал:</span>
      <input
        type="number"
        defaultValue={goal}
        onKeyDown={(e) => e.key === "Enter" && onSave(e.target.value)}
        onBlur={(e) => onSave(e.target.value)}
        autoFocus
        className={styles.input}
      />
    </div>
  );
}
