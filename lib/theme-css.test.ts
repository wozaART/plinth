import { describe, expect, it } from "vitest";
import { themeCssVars } from "./theme-css";
import type { GalleryRow } from "@/lib/supabase/gallery";

const status = (p: string) => ({ bg: `${p}-bg`, fg: `${p}-fg`, dot: `${p}-dot`, panelBg: `${p}-pbg`, panelBorder: `${p}-pb` });

const colors = {
  accent: "#a", accentHover: "#ah", onAccent: "#oa", solid: "#s", onSolid: "#os",
  bgApp: "#bga", bgShell: "#bgs", sidebar: "#sb", surface: "#sf", surfaceDark: "#sd",
  text: "#t", textBody: "#tb", textSecondary: "#ts", textMuted: "#tm", textSoft: "#tso",
  textFaint: "#tf", textEyebrow: "#te", onDark: "#od", onDarkSoft: "#ods", onDarkFaint: "#odf",
  border: "#b", borderStrong: "#bs", borderInput: "#bi", borderChip: "#bc", divider: "#d", borderDark: "#bd",
  status: { pending: status("pe"), approved: status("ap"), declined: status("de"), changes: status("ch") },
  neutralChipBg: "#ncb", neutralChipFg: "#ncf",
};

const vars = themeCssVars({ theme_colors: colors } as unknown as GalleryRow) as Record<string, string>;

describe("themeCssVars", () => {
  it("maps core colours onto --pl-* properties", () => {
    expect(vars["--pl-accent"]).toBe("#a");
    expect(vars["--pl-bg-app"]).toBe("#bga");
    expect(vars["--pl-border-dark"]).toBe("#bd");
  });

  it("maps every status set, with panel colours where defined", () => {
    expect(vars["--pl-pending-bg"]).toBe("pe-bg");
    expect(vars["--pl-approved-panel-border"]).toBe("ap-pb");
    expect(vars["--pl-declined-dot"]).toBe("de-dot");
    expect(vars["--pl-changes-panel-bg"]).toBe("ch-pbg");
  });

  it("keeps legacy aliases pointing at their current tokens", () => {
    expect(vars["--pl-bg"]).toBe(colors.bgApp);
    expect(vars["--pl-bg-warm"]).toBe(colors.bgShell);
    expect(vars["--pl-border-soft"]).toBe(colors.borderStrong);
    expect(vars["--pl-muted"]).toBe(colors.textEyebrow);
    expect(vars["--pl-sub"]).toBe(colors.textSoft);
  });

  it("only emits custom properties with defined values", () => {
    for (const [k, v] of Object.entries(vars)) {
      expect(k.startsWith("--pl-")).toBe(true);
      expect(v, k).toBeDefined();
    }
  });
});
