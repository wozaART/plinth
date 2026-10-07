import type { CSSProperties } from "react";
import type { GalleryRow } from "./supabase/gallery";

interface StatusColorSet {
  bg: string;
  fg: string;
  dot: string;
}

interface StatusPanelColorSet extends StatusColorSet {
  panelBg: string;
  panelBorder: string;
}

interface GalleryThemeColors {
  accent: string;
  accentHover: string;
  onAccent: string;
  solid: string;
  onSolid: string;
  bgApp: string;
  bgShell: string;
  sidebar: string;
  surface: string;
  surfaceDark: string;
  text: string;
  textBody: string;
  textSecondary: string;
  textMuted: string;
  textSoft: string;
  textFaint: string;
  textEyebrow: string;
  onDark: string;
  onDarkSoft: string;
  onDarkFaint: string;
  border: string;
  borderStrong: string;
  borderInput: string;
  borderChip: string;
  divider: string;
  borderDark: string;
  status: {
    pending: StatusColorSet;
    approved: StatusPanelColorSet;
    declined: StatusPanelColorSet;
    changes: StatusPanelColorSet;
  };
  neutralChipBg: string;
  neutralChipFg: string;
}

/**
 * Maps a gallery row's theme_colors onto the --pl-* custom properties
 * declared in app/globals.css, so they can be set as inline styles on
 * <html> and override the CSS fallback defaults at paint time.
 */
export function themeCssVars(gallery: GalleryRow): CSSProperties {
  const c = gallery.theme_colors as unknown as GalleryThemeColors;
  const vars: Record<string, string> = {
    "--pl-accent": c.accent,
    "--pl-accent-hover": c.accentHover,
    "--pl-on-accent": c.onAccent,
    "--pl-solid": c.solid,
    "--pl-on-solid": c.onSolid,
    "--pl-primary": c.text,

    "--pl-bg-app": c.bgApp,
    "--pl-bg-shell": c.bgShell,
    "--pl-sidebar": c.sidebar,
    "--pl-surface": c.surface,
    "--pl-surface-dark": c.surfaceDark,

    "--pl-text": c.text,
    "--pl-text-body": c.textBody,
    "--pl-text-secondary": c.textSecondary,
    "--pl-text-muted": c.textMuted,
    "--pl-text-soft": c.textSoft,
    "--pl-text-faint": c.textFaint,
    "--pl-text-eyebrow": c.textEyebrow,
    "--pl-on-dark": c.onDark,
    "--pl-on-dark-soft": c.onDarkSoft,
    "--pl-on-dark-faint": c.onDarkFaint,

    "--pl-border": c.border,
    "--pl-border-strong": c.borderStrong,
    "--pl-border-input": c.borderInput,
    "--pl-border-chip": c.borderChip,
    "--pl-divider": c.divider,
    "--pl-border-dark": c.borderDark,

    "--pl-pending-bg": c.status.pending.bg,
    "--pl-pending-fg": c.status.pending.fg,
    "--pl-pending-dot": c.status.pending.dot,

    "--pl-approved-bg": c.status.approved.bg,
    "--pl-approved-fg": c.status.approved.fg,
    "--pl-approved-dot": c.status.approved.dot,
    "--pl-approved-panel-bg": c.status.approved.panelBg,
    "--pl-approved-panel-border": c.status.approved.panelBorder,

    "--pl-declined-bg": c.status.declined.bg,
    "--pl-declined-fg": c.status.declined.fg,
    "--pl-declined-dot": c.status.declined.dot,
    "--pl-declined-panel-bg": c.status.declined.panelBg,
    "--pl-declined-panel-border": c.status.declined.panelBorder,

    "--pl-changes-bg": c.status.changes.bg,
    "--pl-changes-fg": c.status.changes.fg,
    "--pl-changes-dot": c.status.changes.dot,
    "--pl-changes-panel-bg": c.status.changes.panelBg,
    "--pl-changes-panel-border": c.status.changes.panelBorder,

    "--pl-neutral-chip-bg": c.neutralChipBg,
    "--pl-neutral-chip-fg": c.neutralChipFg,

    // Legacy aliases (kept for existing component code referencing these names)
    "--pl-bg": c.bgApp,
    "--pl-bg-warm": c.bgShell,
    "--pl-border-soft": c.borderStrong,
    "--pl-muted": c.textEyebrow,
    "--pl-sub": c.textSoft,
  };
  return vars as CSSProperties;
}
