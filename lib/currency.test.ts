import { describe, expect, it } from "vitest";
import { formatCurrency } from "./currency";

// en-ZA uses non-breaking/narrow spaces as group separators; normalise them.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("formatCurrency", () => {
  it("formats ZAR with a prefix and grouped thousands", () => {
    expect(plain(formatCurrency(12500, "ZAR"))).toBe("R 12 500");
  });

  it("rounds to whole rand", () => {
    expect(formatCurrency(99.6, "ZAR")).toContain("100");
    expect(formatCurrency(99.4, "ZAR")).toContain("99");
  });

  it("falls back to ZAR for unknown currency codes", () => {
    expect(formatCurrency(500, "XYZ")).toBe(formatCurrency(500, "ZAR"));
  });

  it("handles zero", () => {
    expect(formatCurrency(0, "ZAR")).toBe("R 0");
  });
});
