import { DayCard } from "./DayCard.tsx";
import { todayKey } from "../utils/date.ts";
import styles from "./EntryHistory.module.css";
import type { StoredSummary } from "../storage/summariesStorage.ts";
import type { SummaryStatus } from "../hooks/useSummaries.ts";
import type { Entry } from "../types.ts";

interface EntryHistoryProps {
  dayOrder: string[];
  days: Record<string, Entry[]>;
  expandedDays: Record<string, boolean>;
  onToggleDay: (dateKey: string) => void;
  onDeleteEntry: (dateKey: string, entryId: string) => void;
  summaries: Record<string, StoredSummary>;
  summaryStatus: Record<string, SummaryStatus>;
  summaryErrors: Record<string, string>;
  goal: number;
  onSummarize: (dateKey: string, entries: Entry[], goal: number) => void;
}

export function EntryHistory({
  dayOrder,
  days,
  expandedDays,
  onToggleDay,
  onDeleteEntry,
  summaries,
  summaryStatus,
  summaryErrors,
  goal,
  onSummarize,
}: EntryHistoryProps) {
  const today = todayKey();
  return (
    <ul className={styles.list}>
      {dayOrder.map((k) => (
        <li key={k}>
          <DayCard
            dateKey={k}
            entries={days[k] || []}
            isToday={k === today}
            expanded={!!expandedDays[k]}
            onToggle={() => onToggleDay(k)}
            onDelete={onDeleteEntry}
            summary={summaries[k]}
            summaryStatus={summaryStatus[k] || "idle"}
            summaryError={summaryErrors[k]}
            goal={goal}
            onSummarize={onSummarize}
          />
        </li>
      ))}
    </ul>
  );
}
