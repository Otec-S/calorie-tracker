import { Digits } from "./Digits.tsx";
import styles from "./ScaleReadout.module.css";

interface ScaleReadoutProps {
  total: number;
  goal: number;
}

export function ScaleReadout({ total, goal }: ScaleReadoutProps) {
  const pct = Math.min(100, Math.round((total / goal) * 100));
  const over = total > goal;

  return (
    <div className={styles.readout}>
      <div className={styles.header}>
        <span className={styles.label}>Сегодня</span>
        <span className={styles.goalLabel}>цель {goal} ккал</span>
      </div>
      <div className={`${styles.total} ${over ? styles.over : ""}`}>
        <Digits value={total} /> <span className={styles.unit}>ккал</span>
      </div>
      <div className={styles.track}>
        <div className={`${styles.fill} ${over ? styles.fillOver : ""}`} style={{ width: `${pct}%` }} />
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.tick} style={{ left: `${(i + 1) * 10}%` }} />
        ))}
      </div>
      <div className={styles.caption}>
        {over ? `Превышение на ${total - goal} ккал` : `Осталось ${goal - total} ккал`}
      </div>
    </div>
  );
}
