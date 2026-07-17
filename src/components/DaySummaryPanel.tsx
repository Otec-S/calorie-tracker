import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import styles from "./DaySummaryPanel.module.css";
import type { StoredSummary } from "../storage/summariesStorage.ts";
import type { SummaryStatus } from "../hooks/useSummaries.ts";

interface DaySummaryPanelProps {
  stored?: StoredSummary;
  status: SummaryStatus;
  error?: string;
  /** True when the day's entries changed after the summary was generated. */
  stale: boolean;
  onGenerate: () => void;
}

export function DaySummaryPanel({ stored, status, error, stale, onGenerate }: DaySummaryPanelProps) {
  if (status === "loading") {
    return (
      <section className={styles.panel} aria-label="Разбор дня">
        <div className={styles.loading}>
          <Loader2 size={15} className="spin" />
          <span>Анализирую рацион…</span>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className={styles.panel} aria-label="Разбор дня">
        <div role="alert" className={styles.error}>
          {error || "Не получилось разобрать день"}
        </div>
        <button onClick={onGenerate} className={styles.generateButton}>
          <RefreshCw size={14} />
          Попробовать ещё раз
        </button>
      </section>
    );
  }

  if (!stored) {
    return (
      <section className={styles.panel} aria-label="Разбор дня">
        <button onClick={onGenerate} className={styles.generateButton}>
          <Sparkles size={14} />
          Разбор дня
        </button>
      </section>
    );
  }

  const { verdict, macro_balance, calorie_target, recommendations } = stored.summary;

  return (
    <section className={styles.panel} aria-label="Разбор дня">
      <h3 className={styles.heading}>
        <Sparkles size={13} className={styles.headingIcon} />
        Разбор дня
      </h3>
      <p className={styles.verdict}>{verdict}</p>
      <p className={styles.detail}>
        <span className={styles.detailLabel}>БЖУ:</span> {macro_balance}
      </p>
      <p className={styles.detail}>
        <span className={styles.detailLabel}>Калории:</span> {calorie_target}
      </p>
      {recommendations.length > 0 && (
        <ul className={styles.recommendations}>
          {recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {stale && (
        <div className={styles.stale}>
          <span>Данные изменились — разбор может быть неактуален.</span>
          <button onClick={onGenerate} className={styles.generateButton}>
            <RefreshCw size={14} />
            Обновить разбор
          </button>
        </div>
      )}
    </section>
  );
}
