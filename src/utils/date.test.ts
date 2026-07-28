import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fmtDate, todayKey } from "./date.ts";

/**
 * Sets the clock in *local* time (month is 1-based for readability). Building
 * the instant locally rather than from a UTC string keeps these assertions
 * true in any timezone, which matters because todayKey() reads the local
 * calendar.
 */
function setLocalTime(year: number, month: number, day: number, hour: number, minute: number): void {
  vi.setSystemTime(new Date(year, month - 1, day, hour, minute, 0, 0));
}

describe("todayKey", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts a meal logged just before 3am toward the previous day", () => {
    setLocalTime(2026, 7, 28, 2, 59);
    expect(todayKey()).toBe("2026-07-27");
  });

  it("starts the new day exactly at 3am", () => {
    setLocalTime(2026, 7, 28, 3, 0);
    expect(todayKey()).toBe("2026-07-28");
  });

  it("treats just after midnight as the previous day", () => {
    setLocalTime(2026, 7, 28, 0, 30);
    expect(todayKey()).toBe("2026-07-27");
  });

  it("keeps late-evening meals on the current day", () => {
    setLocalTime(2026, 7, 28, 23, 59);
    expect(todayKey()).toBe("2026-07-28");
  });

  it("rolls back across a month boundary", () => {
    setLocalTime(2026, 8, 1, 1, 0);
    expect(todayKey()).toBe("2026-07-31");
  });

  it("rolls back across a year boundary", () => {
    setLocalTime(2027, 1, 1, 2, 0);
    expect(todayKey()).toBe("2026-12-31");
  });

  it("pads month and day to a sortable YYYY-MM-DD key", () => {
    // loadAllDayKeys() sorts these lexically, which only works zero-padded.
    setLocalTime(2026, 3, 5, 12, 0);
    expect(todayKey()).toBe("2026-03-05");
  });
});

describe("fmtDate", () => {
  it("formats a day key in Russian without an off-by-one", () => {
    // Parsed as local midnight, not UTC — a UTC parse would render the 27th.
    const formatted = fmtDate("2026-07-28");
    expect(formatted).toContain("28");
    expect(formatted).toContain("июля");
  });

  it("renders the first of the month as that month, not the previous one", () => {
    const formatted = fmtDate("2026-08-01");
    expect(formatted).toContain("1");
    expect(formatted).toContain("август");
  });

  it("yields Invalid Date for a malformed key (documents the missing guard)", () => {
    expect(fmtDate("not-a-date")).toBe("Invalid Date");
  });
});
