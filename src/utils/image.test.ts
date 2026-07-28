import { describe, expect, it } from "vitest";
import { fitWithin } from "./image.ts";

describe("fitWithin", () => {
  it("clamps a landscape image by its width", () => {
    expect(fitWithin(1600, 900, 900)).toEqual({ width: 900, height: 506 });
  });

  it("clamps a portrait image by its height", () => {
    expect(fitWithin(900, 1600, 900)).toEqual({ width: 506, height: 900 });
  });

  it("clamps a square image by its height", () => {
    // width > height is false for a square, so it falls through to the
    // height branch — same result here, but worth pinning down.
    expect(fitWithin(2000, 2000, 900)).toEqual({ width: 900, height: 900 });
  });

  it("clamps a landscape image whose width already fits but height does not", () => {
    expect(fitWithin(800, 1200, 900)).toEqual({ width: 600, height: 900 });
  });

  it("leaves an image that already fits untouched", () => {
    expect(fitWithin(400, 300, 900)).toEqual({ width: 400, height: 300 });
  });

  it("leaves an image sized exactly at the limit untouched", () => {
    expect(fitWithin(900, 900, 900)).toEqual({ width: 900, height: 900 });
  });

  it("preserves the aspect ratio within rounding error", () => {
    const { width, height } = fitWithin(4032, 3024, 900);
    expect(Math.abs(width / height - 4032 / 3024)).toBeLessThan(0.01);
  });
});
