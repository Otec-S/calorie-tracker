export const MIN_GOAL = 500;
export const MAX_GOAL = 6000;
export const DEFAULT_GOAL = 2300;

/**
 * Turns whatever the user typed into the goal field into a usable number.
 * Unparseable input falls back to the default; anything that *did* parse is
 * clamped into range — including 0, which is a real (if useless) number and
 * must not be mistaken for "nothing was entered".
 */
export function clampGoal(rawValue: string): number {
  const parsed = parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) return DEFAULT_GOAL;
  return Math.max(MIN_GOAL, Math.min(MAX_GOAL, parsed));
}
