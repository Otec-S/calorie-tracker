import type { DaySummary, Entry } from "../types.ts";

const KEY_PREFIX = "calorie-tracker:summary:";

export interface StoredSummary {
  summary: DaySummary;
  /** Signature of the entry set the summary was generated from — see entriesSignature(). */
  signature: string;
  generatedAt: string;
}

/**
 * Entries are immutable (only added/removed), so the joined id list uniquely
 * identifies a day's composition. A mismatch with a stored summary's
 * signature means the day changed after the summary was generated.
 */
export function entriesSignature(entries: Entry[]): string {
  return entries.map((e) => e.id).join("|");
}

export function loadSummary(dateKey: string): StoredSummary | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSummary(dateKey: string, stored: StoredSummary): void {
  try {
    localStorage.setItem(KEY_PREFIX + dateKey, JSON.stringify(stored));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/** @returns date keys that have a stored summary */
export function loadAllSummaryKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) keys.push(k.slice(KEY_PREFIX.length));
    }
    return keys;
  } catch {
    return [];
  }
}
