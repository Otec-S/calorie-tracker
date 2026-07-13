import { Trash2 } from "lucide-react";
import styles from "./EntryRow.module.css";

/** @typedef {import("../types.js").Entry} Entry */

/**
 * @param {{ entry: Entry, onDelete: (id: string) => void }} props
 */
export function EntryRow({ entry, onDelete }) {
  return (
    <div className={styles.row}>
      <div className={styles.body}>
        <div className={styles.titleLine}>
          <span className={styles.title}>{entry.title}</span>
          <span className={styles.calories}>
            {entry.cal_min === entry.cal_max ? entry.cal_min : `${entry.cal_min}–${entry.cal_max}`} ккал
          </span>
        </div>
        {entry.items && <div className={styles.items}>{entry.items}</div>}
        <div className={styles.macros}>
          <span>Б {entry.protein_g}г</span>
          <span>Ж {entry.fat_g}г</span>
          <span>У {entry.carbs_g}г</span>
          {entry.portion && <span className={styles.portion}>{entry.portion}</span>}
        </div>
        {entry.note && <div className={styles.note}>{entry.note}</div>}
      </div>
      <button onClick={() => onDelete(entry.id)} className={styles.deleteButton} title="Удалить запись">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
