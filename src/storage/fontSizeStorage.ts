const KEY = "calorie-tracker:settings:fontScale";
const DEFAULT_SCALE = 1;

export function loadFontScale(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SCALE;
  } catch {
    return DEFAULT_SCALE;
  }
}

export function saveFontScale(scale: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(scale));
  } catch (e) {
    console.error("Storage error:", e);
  }
}
