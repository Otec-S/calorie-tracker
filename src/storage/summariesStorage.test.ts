import { describe, expect, it } from "vitest";
import type { Entry } from "../types.ts";
import { entriesSignature } from "./summariesStorage.ts";

function entry(id: string): Entry {
  return {
    id,
    time: "12:30",
    title: "Обед",
    items: "",
    portion: "",
    cal_min: 300,
    cal_max: 350,
    protein_g: 10,
    fat_g: 8,
    carbs_g: 50,
    note: "",
  };
}

describe("entriesSignature", () => {
  it("is stable for the same entries", () => {
    expect(entriesSignature([entry("a"), entry("b")])).toBe(entriesSignature([entry("a"), entry("b")]));
  });

  it("changes when an entry is added", () => {
    expect(entriesSignature([entry("a")])).not.toBe(entriesSignature([entry("a"), entry("b")]));
  });

  it("changes when an entry is removed", () => {
    expect(entriesSignature([entry("a"), entry("b")])).not.toBe(entriesSignature([entry("b")]));
  });

  it("is order-sensitive", () => {
    expect(entriesSignature([entry("a"), entry("b")])).not.toBe(entriesSignature([entry("b"), entry("a")]));
  });

  it("yields an empty signature for an empty day", () => {
    expect(entriesSignature([])).toBe("");
  });
});
