import { useCallback, useEffect, useState } from "react";
import { loadFontScale, saveFontScale } from "../storage/fontSizeStorage.ts";
import { BASE_FONT_PX, MAX_SCALE, MIN_SCALE, SCALE_STEP, stepFontScale } from "../utils/fontScale.ts";

/** Owns the app-wide font-size scale, persisted to localStorage and applied to the document root. */
export function useFontSize() {
  const [scale, setScale] = useState<number>(() => loadFontScale());

  useEffect(() => {
    document.documentElement.style.fontSize = `${BASE_FONT_PX * scale}px`;
  }, [scale]);

  const increaseFontSize = useCallback(() => {
    setScale((s) => {
      const next = stepFontScale(s, SCALE_STEP);
      saveFontScale(next);
      return next;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setScale((s) => {
      const next = stepFontScale(s, -SCALE_STEP);
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
