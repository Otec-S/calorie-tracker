const KEY = "calorie-tracker:settings:goal";
const DEFAULT_GOAL = 2300;

/** @returns {number} */
export function loadGoal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

/** @param {number} goal */
export function saveGoal(goal) {
  try {
    localStorage.setItem(KEY, JSON.stringify(goal));
  } catch (e) {
    console.error("Storage error:", e);
  }
}
