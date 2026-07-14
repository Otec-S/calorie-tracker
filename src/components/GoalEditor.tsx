import styles from "./GoalEditor.module.css";

interface GoalEditorProps {
  goal: number;
  onSave: (rawValue: string) => void;
}

export function GoalEditor({ goal, onSave }: GoalEditorProps) {
  return (
    <div className={styles.editor}>
      <label htmlFor="daily-goal-input" className={styles.label}>
        Дневная цель, ккал:
      </label>
      <input
        id="daily-goal-input"
        type="number"
        defaultValue={goal}
        onKeyDown={(e) => e.key === "Enter" && onSave(e.currentTarget.value)}
        onBlur={(e) => onSave(e.currentTarget.value)}
        autoFocus
        className={styles.input}
      />
    </div>
  );
}
