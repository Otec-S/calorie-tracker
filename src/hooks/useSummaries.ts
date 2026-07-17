import { useCallback, useEffect, useState } from "react";
import { summarizeDay } from "../api/claude.ts";
import {
  entriesSignature,
  loadAllSummaryKeys,
  loadSummary,
  saveSummary,
  type StoredSummary,
} from "../storage/summariesStorage.ts";
import type { Entry } from "../types.ts";

export type SummaryStatus = "idle" | "loading" | "error";

/**
 * Owns the per-day diet summaries: loading cached ones from storage and
 * generating new ones via the backend. State is keyed per day so a summary
 * loading for one day doesn't block another.
 */
export function useSummaries() {
  const [summaries, setSummaries] = useState<Record<string, StoredSummary>>({});
  const [summaryStatus, setSummaryStatus] = useState<Record<string, SummaryStatus>>({});
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaded: Record<string, StoredSummary> = {};
    for (const k of loadAllSummaryKeys()) {
      const stored = loadSummary(k);
      if (stored) loaded[k] = stored;
    }
    setSummaries(loaded);
  }, []);

  const generateSummary = useCallback(async (dateKey: string, entries: Entry[], goal: number) => {
    setSummaryStatus((s) => ({ ...s, [dateKey]: "loading" }));
    setSummaryErrors((e) => ({ ...e, [dateKey]: "" }));
    try {
      const summary = await summarizeDay(entries, goal);
      const stored: StoredSummary = {
        summary,
        signature: entriesSignature(entries),
        generatedAt: new Date().toISOString(),
      };
      saveSummary(dateKey, stored);
      setSummaries((s) => ({ ...s, [dateKey]: stored }));
      setSummaryStatus((s) => ({ ...s, [dateKey]: "idle" }));
    } catch (err) {
      console.error(err);
      setSummaryErrors((e) => ({
        ...e,
        [dateKey]: err instanceof Error ? err.message : "Не получилось разобрать день",
      }));
      setSummaryStatus((s) => ({ ...s, [dateKey]: "error" }));
    }
  }, []);

  return { summaries, summaryStatus, summaryErrors, generateSummary };
}
