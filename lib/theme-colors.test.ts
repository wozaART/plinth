import { describe, expect, it } from "vitest";
import { accentHover, isHexColor, onAccent, themeSettingsFor } from "./theme-colors";

describe("theme colours", () => {
  it("accepts only 6-digit hex", () => {
    expect(isHexColor("#B5623C")).toBe(true);
    expect(isHexColor("#b5623c")).toBe(true);
    for (const v of ["", "B5623C", "#FFF", "#GGGGGG", "red", "#B5623C1"]) expect(isHexColor(v)).toBe(false);
  });

  it("darkens the hover shade", () => {
    expect(accentHover("#FFFFFF")).toBe("#D9D9D9");
    expect(accentHover("#000000")).toBe("#000000");
  });

  it("picks readable text for the accent", () => {
    expect(onAccent("#22C39C")).toBe("#17150F");
    expect(onAccent("#B5623C")).toBe("#FBFAF8");
  });

  it("falls back to defaults when a gallery has no theme set", () => {
    expect(themeSettingsFor({ theme_mode: "light", theme_colors: {}, font_display: {}, font_body: null })).toEqual({
      mode: "light", accent: "#B5623C", ink: "#17150F", sidebar: "#F4F1EA", fontDisplay: "Newsreader", fontBody: "Geist",
    });
  });
});
