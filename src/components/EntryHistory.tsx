import { DayCard } from "./DayCard.tsx";
import { todayKey } from "../utils/date.ts";
import styles from "./EntryHistory.module.css";
import type { Entry } from "../types.ts";

interface EntryHistoryProps {
  dayOrder: string[];
  days: Record<string, Entry[]>;
  expandedDays: Record<string, boolean>;
  onToggleDay: (dateKey: string) => void;
  onDeleteEntry: (dateKey: string, entryId: string) => void;
}

export function EntryHistory({ dayOrder, days, expandedDays, onToggleDay, onDeleteEntry }: EntryHistoryProps) {
  const today = todayKey();
  return (
    <div className={styles.list}>
      {dayOrder.map((k) => (
        <DayCard
          key={k}
          dateKey={k}
          entries={days[k] || []}
          isToday={k === today}
          expanded={!!expandedDays[k]}
          onToggle={() => onToggleDay(k)}
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  );
}
