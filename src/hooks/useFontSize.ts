import { useCallback, useEffect, useState } from "react";
import { loadFontScale, saveFontScale } from "../storage/fontSizeStorage.ts";

const MIN_SCALE = 0.9;
const MAX_SCALE = 1.4;
const STEP = 0.1;
const BASE_FONT_PX = 16;

/** Owns the app-wide font-size scale, persisted to localStorage and applied to the document root. */
export function useFontSize() {
  const [scale, setScale] = useState<number>(() => loadFontScale());

  useEffect(() => {
    document.documentElement.style.fontSize = `${BASE_FONT_PX * scale}px`;
  }, [scale]);

  const increaseFontSize = useCallback(() => {
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.round((s + STEP) * 100) / 100);
      saveFontScale(next);
      return next;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setScale((s) => {
      const next = Math.max(MIN_SCALE, Math.round((s - STEP) * 100) / 100);
      saveFontScale(next);
      return next;
    });
  }, []);

  return {
    fontScale: scale,
    canIncreaseFontSize: scale < MAX_SCALE,
    canDecreaseFontSize: scale > MIN_SCALE,
    increaseFontSize,
    decreaseFontSize,
  };
}
