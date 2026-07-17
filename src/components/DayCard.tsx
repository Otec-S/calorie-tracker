import { ChevronDown, ChevronRight } from "lucide-react";
import { EntryRow } from "./EntryRow.tsx";
import { DaySummaryPanel } from "./DaySummaryPanel.tsx";
import { fmtDate } from "../utils/date.ts";
import { entriesSignature, type StoredSummary } from "../storage/summariesStorage.ts";
import type { SummaryStatus } from "../hooks/useSummaries.ts";
import styles from "./DayCard.module.css";
import type { Entry } from "../types.ts";

interface DayCardProps {
  dateKey: string;
  entries: Entry[];
  isToday: boolean;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (dateKey: string, entryId: string) => void;
  summary?: StoredSummary;
  summaryStatus: SummaryStatus;
  summaryError?: string;
  goal: number;
  onSummarize: (dateKey: string, entries: Entry[], goal: number) => void;
}

export function DayCard({
  dateKey,
  entries,
  isToday,
  expanded,
  onToggle,
  onDelete,
  summary,
  summaryStatus,
  summaryError,
  goal,
  onSummarize,
}: DayCardProps) {
  const total = entries.reduce((s, e) => s + (e.cal_max || e.cal_min || 0), 0);

  const bodyId = `day-body-${dateKey}`;

  return (
    <div className={styles.card}>
      <button
        onClick={onToggle}
        className={`${styles.header} ${isToday ? styles.headerToday : ""}`}
        aria-expanded={expanded}
        aria-controls={bodyId}
      >
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
        <div id={bodyId} className={styles.body}>
          <ul className={styles.entryList}>
            {entries.length === 0 ? (
              <li className={styles.empty}>Пока пусто</li>
            ) : (
              entries.map((e) => <EntryRow key={e.id} entry={e} onDelete={(id) => onDelete(dateKey, id)} />)
            )}
          </ul>
          {entries.length > 0 && (
            <DaySummaryPanel
              stored={summary}
              status={summaryStatus}
              error={summaryError}
              stale={!!summary && summary.signature !== entriesSignature(entries)}
              onGenerate={() => onSummarize(dateKey, entries, goal)}
            />
          )}
        </div>
      )}
    </div>
  );
}
