import { describe, expect, it } from "vitest";
import { clampGoal, DEFAULT_GOAL, MAX_GOAL, MIN_GOAL } from "./goal.ts";

describe("clampGoal", () => {
  it.each([
    ["", DEFAULT_GOAL, "empty input falls back to the default"],
    ["abc", DEFAULT_GOAL, "unparseable input falls back to the default"],
    // Regression guard: `parseInt("0") || DEFAULT_GOAL` used to return 2300
    // here, because 0 is falsy — a typed 0 must clamp to the minimum instead.
    ["0", MIN_GOAL, "a typed zero clamps to the minimum, not the default"],
    ["-5", MIN_GOAL, "negatives clamp to the minimum"],
    ["100", MIN_GOAL, "below-range values clamp up"],
    ["500", MIN_GOAL, "the minimum itself is kept"],
    ["2500", 2500, "in-range values pass through"],
    ["6000", MAX_GOAL, "the maximum itself is kept"],
    ["9999", MAX_GOAL, "above-range values clamp down"],
    ["2500abc", 2500, "a trailing suffix is ignored, like parseInt does"],
    ["3.9", MIN_GOAL, "decimals truncate, then clamp"],
  ])("clampGoal(%j) -> %i (%s)", (input, expected) => {
    expect(clampGoal(input)).toBe(expected);
  });
});
