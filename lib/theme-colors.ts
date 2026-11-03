type FontSpec = { googleFont: string; weights?: string[]; styles?: string[] };

export const DISPLAY_FONTS: Record<string, FontSpec> = {
  Newsreader: { googleFont: "Newsreader", weights: ["400", "500", "600"], styles: ["normal", "italic"] },
  Cinzel: { googleFont: "Cinzel", weights: ["500", "600", "700"] },
};

export const BODY_FONTS: Record<string, FontSpec> = {
  Geist: { googleFont: "Geist" },
  Poppins: { googleFont: "Poppins", weights: ["300", "400", "500", "600", "700"] },
};

export const ACCENT_SWATCHES = [
  "#B5623C", "#8A3A30", "#3C566B", "#4A6138",
  "#6E5A8A", "#A8842C", "#2A6F6B", "#1F1D1A",
];

export const INK_OPTIONS = [
  { name: "Charcoal", color: "#17150F" },
  { name: "Navy", color: "#14213F" },
  { name: "Forest", color: "#163326" },
  { name: "Aubergine", color: "#301B2E" },
];

export const SIDEBAR_OPTIONS = [
  { name: "Warm", color: "#F4F1EA" },
  { name: "Stone", color: "#EFEDE6" },
  { name: "Mist", color: "#ECEEEC" },
];

export const DISPLAY_FONT_CARDS = [
  { id: "Newsreader", label: "Editorial", desc: "Serif headlines", stack: "var(--font-newsreader-base, serif)" },
  { id: "Cinzel", label: "Classic", desc: "Engraved capitals", stack: "var(--font-cinzel, serif)" },
];

export const BODY_FONT_CARDS = [
  { id: "Geist", label: "Geist", desc: "Clean and neutral", stack: "var(--font-geist-base, sans-serif)" },
  { id: "Poppins", label: "Poppins", desc: "Round and friendly", stack: "var(--font-poppins, sans-serif)" },
];

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(rgb: number[]): string {
  return "#" + rgb.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Hover shade: the accent darkened by 15%. */
export function accentHover(hex: string): string {
  return toHex(channels(hex).map(v => v * 0.85));
}

/** Near-black or near-white, whichever reads better on top of the accent. */
export function onAccent(hex: string): string {
  return luminance(hex) > 0.4 ? "#17150F" : "#FBFAF8";
}

/** Settings-panel values for a gallery, falling back to the app/globals.css defaults when theme_colors is sparse. */
export function themeSettingsFor(gallery: {
  theme_mode: string;
  theme_colors: unknown;
  font_display: unknown;
  font_body: unknown;
}) {
  const colors = (gallery.theme_colors ?? {}) as Partial<Record<"accent" | "solid" | "sidebar", string>>;
  const font = (value: unknown, fallback: string) => (value as { googleFont?: string } | null)?.googleFont ?? fallback;
  return {
    mode: gallery.theme_mode,
    accent: colors.accent ?? ACCENT_SWATCHES[0],
    ink: colors.solid ?? INK_OPTIONS[0].color,
    sidebar: colors.sidebar ?? SIDEBAR_OPTIONS[0].color,
    fontDisplay: font(gallery.font_display, "Newsreader"),
    fontBody: font(gallery.font_body, "Geist"),
  };
}
