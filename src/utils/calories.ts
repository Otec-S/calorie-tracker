/** The two fields a calorie total needs — narrower than Entry so tests can pass literals. */
type CalorieRange = { cal_min?: number; cal_max?: number };

/**
 * Calories counted for one entry: the upper bound of the model's estimate,
 * falling back to the lower bound when the upper one is missing.
 *
 * Nullish-coalescing, not `||`, is deliberate: the analysis prompt makes the
 * model return cal_min/cal_max of 0 when it can't identify the food, and a
 * genuine 0 must stay 0 instead of falling through to the other bound.
 */
export function entryCalories(entry: CalorieRange): number {
  return entry.cal_max ?? entry.cal_min ?? 0;
}

/** Total calories for a day's entries. */
export function totalCalories(entries: CalorieRange[]): number {
  return entries.reduce((sum, entry) => sum + entryCalories(entry), 0);
}
