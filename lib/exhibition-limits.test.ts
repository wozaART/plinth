import { describe, expect, it } from "vitest";
import { parseLimit, sizeLabel, weightLabel } from "./exhibition-limits";

describe("exhibition limits", () => {
  it("parses positive numbers and treats anything else as no limit", () => {
    expect(["150", "12.345", "", " ", "0", "-3", "0.001", "abc"].map(parseLimit)).toEqual([150, 12.35, null, null, null, null, null, null]);
  });

  it("labels size as H × L × W, skipping blanks and keeping older notes", () => {
    const none = { maxHeightCm: null, maxLengthCm: null, maxWidthCm: null, sizeRequirements: "" };
    expect(sizeLabel(none)).toBe("");
    expect(sizeLabel({ ...none, maxHeightCm: 150, maxLengthCm: 100, maxWidthCm: 20 })).toBe("Max H 150 × L 100 × W 20 cm");
    expect(sizeLabel({ ...none, maxWidthCm: 20, sizeRequirements: "Mixed" })).toBe("Max W 20 cm · Mixed");
  });

  it("labels both weights", () => {
    expect(weightLabel({ maxWeightExclPackagingKg: null, maxWeightInclPackagingKg: null })).toBe("");
    expect(weightLabel({ maxWeightExclPackagingKg: 20, maxWeightInclPackagingKg: 35.5 })).toBe("Max 20 kg excluding packaging · Max 35.5 kg including packaging / crating");
  });
});
