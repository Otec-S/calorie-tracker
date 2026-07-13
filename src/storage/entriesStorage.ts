import type { Entry } from "../types.ts";

const KEY_PREFIX = "calorie-tracker:entries:";

export function loadDay(dateKey: string): Entry[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDay(dateKey: string, entries: Entry[]): void {
  try {
    localStorage.setItem(KEY_PREFIX + dateKey, JSON.stringify(entries));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/** @returns date keys, newest first */
export function loadAllDayKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) keys.push(k.slice(KEY_PREFIX.length));
    }
    return keys.sort().reverse();
  } catch {
    return [];
  }
}
