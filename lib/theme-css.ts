import type { CSSProperties } from "react";
import type { GalleryConfig } from "./gallery-config.types";

/**
 * Maps a GalleryConfig's theme colors onto the --pl-* custom properties
 * declared in app/globals.css, so they can be set as inline styles on
 * <html> and override the CSS fallback defaults at paint time.
 */
export function themeCssVars(config: GalleryConfig): CSSProperties {
  const c = config.theme.colors;
  const vars: Record<string, string> = {
    "--pl-accent": c.accent,
    "--pl-accent-hover": c.accentHover,
    "--pl-on-accent": c.onAccent,
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
