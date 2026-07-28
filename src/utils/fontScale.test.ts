import { describe, expect, it } from "vitest";
import { MAX_SCALE, MIN_SCALE, SCALE_STEP, stepFontScale } from "./fontScale.ts";

describe("stepFontScale", () => {
  it("steps up by one increment", () => {
    expect(stepFontScale(1, SCALE_STEP)).toBe(1.1);
  });

  it("steps down by one increment", () => {
    expect(stepFontScale(1, -SCALE_STEP)).toBe(0.9);
  });

  it("does not accumulate binary float drift", () => {
    // 1.1 + 0.1 is 1.2000000000000002 unrounded; left alone, the drift keeps
    // the scale from ever comparing equal to MAX_SCALE and the +/- buttons
    // never disable at the ends.
    expect(stepFontScale(1.1, SCALE_STEP)).toBe(1.2);
    expect(stepFontScale(1.2, SCALE_STEP)).toBe(1.3);
    expect(stepFontScale(1.3, SCALE_STEP)).toBe(MAX_SCALE);
  });

  it("stays exact across a full round trip up and back down", () => {
    let scale = MIN_SCALE;
    for (let i = 0; i < 5; i++) scale = stepFontScale(scale, SCALE_STEP);
    expect(scale).toBe(MAX_SCALE);
    for (let i = 0; i < 5; i++) scale = stepFontScale(scale, -SCALE_STEP);
    expect(scale).toBe(MIN_SCALE);
  });

  it("clamps at the upper bound", () => {
    expect(stepFontScale(MAX_SCALE, SCALE_STEP)).toBe(MAX_SCALE);
  });

  it("clamps at the lower bound", () => {
    expect(stepFontScale(MIN_SCALE, -SCALE_STEP)).toBe(MIN_SCALE);
  });
});
