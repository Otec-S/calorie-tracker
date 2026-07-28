/**
 * @vitest-environment jsdom
 *
 * The only suite that needs a DOM — everything here goes through localStorage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Entry } from "../types.ts";
import { loadAllDayKeys, loadDay, saveDay } from "./entriesStorage.ts";

function entry(id: string): Entry {
  return {
    id,
    time: "12:30",
    title: "Овсянка",
    items: "овсянка, молоко",
    portion: "250 г",
    cal_min: 300,
    cal_max: 350,
    protein_g: 10,
    fat_g: 8,
    carbs_g: 50,
    note: "",
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadDay / saveDay", () => {
  it("round-trips a day's entries", () => {
    saveDay("2026-07-28", [entry("a"), entry("b")]);
    expect(loadDay("2026-07-28").map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("returns an empty day for a date that was never written", () => {
    expect(loadDay("2026-01-01")).toEqual([]);
  });

  it("returns an empty day instead of throwing on corrupted JSON", () => {
    localStorage.setItem("calorie-tracker:entries:2026-07-28", "{not json");
    expect(loadDay("2026-07-28")).toEqual([]);
  });

  it("swallows a storage write failure rather than breaking the UI", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => saveDay("2026-07-28", [entry("a")])).not.toThrow();
  });
});

describe("loadAllDayKeys", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(loadAllDayKeys()).toEqual([]);
  });

  it("returns day keys newest first", () => {
    saveDay("2026-07-26", []);
    saveDay("2026-08-02", []);
    saveDay("2026-07-28", []);

    expect(loadAllDayKeys()).toEqual(["2026-08-02", "2026-07-28", "2026-07-26"]);
  });

  it("ignores summary and settings keys sharing the app prefix", () => {
    saveDay("2026-07-28", []);
    localStorage.setItem("calorie-tracker:summary:2026-07-28", "{}");
    localStorage.setItem("calorie-tracker:settings:goal", "2300");
    localStorage.setItem("calorie-tracker:settings:fontScale", "1");
    localStorage.setItem("calorie-tracker:chat", "[]");
    localStorage.setItem("unrelated-app:entries:2026-07-28", "[]");

    expect(loadAllDayKeys()).toEqual(["2026-07-28"]);
  });
});
