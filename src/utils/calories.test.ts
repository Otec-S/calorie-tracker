import { describe, expect, it } from "vitest";
import { entryCalories, totalCalories } from "./calories.ts";

describe("entryCalories", () => {
  it("uses the upper bound of the estimate", () => {
    expect(entryCalories({ cal_min: 400, cal_max: 550 })).toBe(550);
  });

  // Regression guard: with `||` a legitimate zero fell through to cal_min,
  // so an unrecognised dish (which the prompt makes the model report as
  // 0/0) could still add calories to the day if cal_min came back non-zero.
  it("keeps a genuine zero upper bound instead of falling back", () => {
    expect(entryCalories({ cal_min: 300, cal_max: 0 })).toBe(0);
  });

  it("falls back to the lower bound when the upper one is missing", () => {
    expect(entryCalories({ cal_min: 420 })).toBe(420);
  });

  it("yields 0 when neither bound is present", () => {
    expect(entryCalories({})).toBe(0);
  });
});

describe("totalCalories", () => {
  it("sums a day's entries", () => {
    expect(
      totalCalories([
        { cal_min: 400, cal_max: 550 },
        { cal_min: 120, cal_max: 130 },
        { cal_min: 70, cal_max: 80 },
      ]),
    ).toBe(760);
  });

  it("does not let an unrecognised entry inflate the total", () => {
    expect(totalCalories([{ cal_min: 500, cal_max: 600 }, { cal_min: 0, cal_max: 0 }])).toBe(600);
  });

  it("returns 0 for an empty day", () => {
    expect(totalCalories([])).toBe(0);
  });
});
