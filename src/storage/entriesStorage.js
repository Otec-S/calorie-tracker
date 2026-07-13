/** @typedef {import("../types.js").Entry} Entry */

const KEY_PREFIX = "calorie-tracker:entries:";

/**
 * @param {string} dateKey
 * @returns {Entry[]}
 */
export function loadDay(dateKey) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} dateKey
 * @param {Entry[]} entries
 */
export function saveDay(dateKey, entries) {
  try {
    localStorage.setItem(KEY_PREFIX + dateKey, JSON.stringify(entries));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/** @returns {string[]} date keys, newest first */
export function loadAllDayKeys() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) keys.push(k.slice(KEY_PREFIX.length));
    }
    return keys.sort().reverse();
  } catch {
    return [];
  }
}
