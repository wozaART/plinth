import { describe, expect, it } from "vitest";
import { demoBrandCssVars, demoBrandFontHref, parseDemoBrand, type DemoBrand } from "./demo-brand";

const base = { name: "Studio", accent: "#B5623C", ink: "#2A2723", sidebar: "#F4EFE6", font: "serif", customFont: "" };
const cookie = (v: unknown) => encodeURIComponent(JSON.stringify(v));

describe("parseDemoBrand", () => {
  it("parses a valid cookie", () => {
    expect(parseDemoBrand(cookie(base))).toEqual(base);
  });

  it.each([undefined, "", "not json", "%E0%A4%A", cookie(null), cookie("str"), cookie([])])("returns null for %j", (raw) => {
    expect(parseDemoBrand(raw as string | undefined)).toBeNull();
  });

  it.each(["accent", "ink", "sidebar"])("returns null when %s is missing", (key) => {
    expect(parseDemoBrand(cookie({ ...base, [key]: undefined }))).toBeNull();
  });

  it.each(["red", "#FFF", "#GGGGGG", "#12345", "#1234567", "123456", "javascript:alert(1)", "#B5623C;background:url(x)"])(
    "returns null for invalid colour %j",
    (colour) => {
      expect(parseDemoBrand(cookie({ ...base, accent: colour }))).toBeNull();
      expect(parseDemoBrand(cookie({ ...base, ink: colour }))).toBeNull();
      expect(parseDemoBrand(cookie({ ...base, sidebar: colour }))).toBeNull();
    },
  );

  it("trims and truncates the name to 80 characters, defaulting to empty", () => {
    expect(parseDemoBrand(cookie({ ...base, name: "  Studio  " }))?.name).toBe("Studio");
    expect(parseDemoBrand(cookie({ ...base, name: "x".repeat(200) }))?.name).toHaveLength(80);
    expect(parseDemoBrand(cookie({ ...base, name: 5 }))?.name).toBe("");
  });

  it("accepts the sans and custom fonts and defaults anything else to serif", () => {
    expect(parseDemoBrand(cookie({ ...base, font: "sans" }))?.font).toBe("sans");
    expect(parseDemoBrand(cookie({ ...base, font: "custom", customFont: "Lora" }))?.font).toBe("custom");
    expect(parseDemoBrand(cookie({ ...base, font: "comic" }))?.font).toBe("serif");
  });

  it.each(["", "   ", "Lora'; } body { display:none", "<script>", "x".repeat(61), 5])(
    "falls back to serif with no custom font when it is missing or unsafe (%j)",
    (customFont) => {
      expect(parseDemoBrand(cookie({ ...base, font: "custom", customFont }))).toMatchObject({ font: "serif", customFont: "" });
    },
  );

  it("trims a valid custom font name", () => {
    expect(parseDemoBrand(cookie({ ...base, font: "custom", customFont: " Open Sans " }))).toMatchObject({
      font: "custom",
      customFont: "Open Sans",
    });
  });

  it("drops unknown properties", () => {
    const b = parseDemoBrand(cookie({ ...base, evil: "x" }));
    expect(b).not.toHaveProperty("evil");
  });
});

describe("demoBrandCssVars", () => {
  const brand: DemoBrand = { ...base, font: "serif" } as DemoBrand;
  const vars = (b: DemoBrand) => demoBrandCssVars(b) as Record<string, string>;

  it("maps the brand colours onto the theme properties", () => {
    expect(vars(brand)).toMatchObject({
      "--pl-accent": "#B5623C",
      "--pl-solid": "#2A2723",
      "--pl-primary": "#2A2723",
      "--pl-text": "#2A2723",
      "--pl-surface-dark": "#2A2723",
      "--pl-sidebar": "#F4EFE6",
    });
  });

  it("derives a darker hover colour", () => {
    expect(vars({ ...brand, accent: "#FFFFFF" })["--pl-accent-hover"]).toBe("#dbdbdb");
    expect(vars({ ...brand, accent: "#000000" })["--pl-accent-hover"]).toBe("#000000");
    expect(vars(brand)["--pl-accent-hover"]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("leaves the font alone for serif, switches to the sans stack, or uses the custom family", () => {
    expect(vars(brand)).not.toHaveProperty("--font-newsreader");
    expect(vars({ ...brand, font: "sans" })["--font-newsreader"]).toBe("var(--font-geist-sans)");
    expect(vars({ ...brand, font: "custom", customFont: "Lora" })["--font-newsreader"]).toBe("'Lora', serif");
  });
});

describe("demoBrandFontHref", () => {
  it("is null unless a custom font is chosen", () => {
    expect(demoBrandFontHref({ ...base, font: "serif" } as DemoBrand)).toBeNull();
    expect(demoBrandFontHref({ ...base, font: "sans" } as DemoBrand)).toBeNull();
  });

  it("builds a Google Fonts URL with spaces as plus signs", () => {
    expect(demoBrandFontHref({ ...base, font: "custom", customFont: "Open Sans" } as DemoBrand)).toBe(
      "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap",
    );
  });
});
