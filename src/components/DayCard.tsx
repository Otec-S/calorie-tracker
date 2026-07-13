import { ChevronDown, ChevronRight } from "lucide-react";
import { EntryRow } from "./EntryRow.tsx";
import { fmtDate } from "../utils/date.ts";
import styles from "./DayCard.module.css";
import type { Entry } from "../types.ts";

interface DayCardProps {
  dateKey: string;
  entries: Entry[];
  isToday: boolean;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (dateKey: string, entryId: string) => void;
}

export function DayCard({ dateKey, entries, isToday, expanded, onToggle, onDelete }: DayCardProps) {
  const total = entries.reduce((s, e) => s + (e.cal_max || e.cal_min || 0), 0);

  return (
    <div className={styles.card}>
      <button onClick={onToggle} className={`${styles.header} ${isToday ? styles.headerToday : ""}`}>
        <span className={styles.label}>{isToday ? "Сегодня" : fmtDate(dateKey)}</span>
        <span className={styles.summary}>
          <span className={styles.total}>{total} ккал</span>
          {expanded ? (
            <ChevronDown size={16} className={styles.chevron} />
          ) : (
            <ChevronRight size={16} className={styles.chevron} />
          )}
        </span>
      </button>
      {expanded && (
        <div className={styles.body}>
          {entries.length === 0 ? (
            <div className={styles.empty}>Пока пусто</div>
          ) : (
            entries.map((e) => <EntryRow key={e.id} entry={e} onDelete={(id) => onDelete(dateKey, id)} />)
          )}
        </div>
      )}
    </div>
  );
}
