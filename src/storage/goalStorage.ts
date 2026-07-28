import { DEFAULT_GOAL } from "../utils/goal.ts";

const KEY = "calorie-tracker:settings:goal";

export function loadGoal(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

export function saveGoal(goal: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(goal));
  } catch (e) {
    console.error("Storage error:", e);
  }
}
