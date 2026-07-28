export const MIN_SCALE = 0.9;
export const MAX_SCALE = 1.4;
export const SCALE_STEP = 0.1;
export const BASE_FONT_PX = 16;

/**
 * Moves the font scale by one step and clamps it into range.
 *
 * The rounding matters: 1.1 + 0.1 is 1.2000000000000002 in binary floating
 * point, and without rounding those artefacts accumulate until the scale can
 * never compare equal to MIN_SCALE/MAX_SCALE and the +/- buttons stop
 * disabling themselves at the ends.
 */
export function stepFontScale(current: number, step: number): number {
  const next = Math.round((current + step) * 100) / 100;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
}
