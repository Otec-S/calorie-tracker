import { DayCard } from "./DayCard.jsx";
import { todayKey } from "../utils/date.js";
import styles from "./EntryHistory.module.css";

/** @typedef {import("../types.js").Entry} Entry */

/**
 * @param {{
 *   dayOrder: string[],
 *   days: Record<string, Entry[]>,
 *   expandedDays: Record<string, boolean>,
 *   onToggleDay: (dateKey: string) => void,
 *   onDeleteEntry: (dateKey: string, entryId: string) => void,
 * }} props
 */
export function EntryHistory({ dayOrder, days, expandedDays, onToggleDay, onDeleteEntry }) {
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
