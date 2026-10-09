import type { CSSProperties } from "react";

// Branding picked on /review travels into the live demo portals via this
// cookie. It is only ever applied to demo accounts (see the portal layout),
// and every value is validated here because the cookie is user-controlled.
export const DEMO_BRAND_COOKIE = "pl_brand";

// Same-origin path the visitor entered the demo from (set by /demo/[role]).
export const DEMO_BACK_COOKIE = "pl_demo_back";

export function safeBackPath(raw: string | undefined): string {
  return raw && /^\/(?!\/)[\w\-./]*(\?step=preview)?$/.test(raw) ? raw : "/";
}

export interface DemoBrand {
  name: string;
  accent: string;
  ink: string;
  sidebar: string;
  font: "serif" | "sans" | "custom";
  customFont: string;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const FONT_NAME = /^[A-Za-z0-9 ]{1,60}$/;

export function parseDemoBrand(raw: string | undefined): DemoBrand | null {
  if (!raw) return null;
  try {
    const b = JSON.parse(decodeURIComponent(raw)) as Partial<DemoBrand>;
    if (!b.accent || !b.ink || !b.sidebar) return null;
    if (![b.accent, b.ink, b.sidebar].every((c) => HEX.test(c))) return null;
    const font = b.font === "sans" || b.font === "custom" ? b.font : "serif";
    const customFont = typeof b.customFont === "string" && FONT_NAME.test(b.customFont.trim()) ? b.customFont.trim() : "";
    return {
      name: typeof b.name === "string" ? b.name.trim().slice(0, 80) : "",
      accent: b.accent,
      ink: b.ink,
      sidebar: b.sidebar,
      font: font === "custom" && !customFont ? "serif" : font,
      customFont,
    };
  } catch {
    return null;
  }
}

function darken(hex: string, amount = 0.14): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

export function demoBrandCssVars(brand: DemoBrand): CSSProperties {
  const vars: Record<string, string> = {
    "--pl-accent": brand.accent,
    "--pl-accent-hover": darken(brand.accent),
    "--pl-solid": brand.ink,
    "--pl-primary": brand.ink,
    "--pl-text": brand.ink,
    "--pl-surface-dark": brand.ink,
    "--pl-sidebar": brand.sidebar,
  };
  if (brand.font === "sans") vars["--font-newsreader"] = "var(--font-geist-sans)";
  if (brand.font === "custom") vars["--font-newsreader"] = `'${brand.customFont}', serif`;
  return vars as CSSProperties;
}

export function demoBrandFontHref(brand: DemoBrand): string | null {
  if (brand.font !== "custom") return null;
  return `https://fonts.googleapis.com/css2?family=${brand.customFont.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
}
