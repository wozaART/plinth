import type { SubmissionStatus, CatalogueStatus, PayoutStatus } from "./types";

export const ARTWORK_GRADIENTS = [
  "radial-gradient(circle at 72% 30%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)",
  "linear-gradient(112deg,#9AA487 0 52%, #7C8869 52%)",
  "linear-gradient(#1C1A17 0 33%, #C99A3F 33%)",
  "radial-gradient(circle at 50% 56%, #38415C 0 25%, rgba(56,65,92,0) 25.5%), #E7E1D4",
  "linear-gradient(160deg,#C9A9A2,#B5897F)",
  "linear-gradient(#6E7355 0 50%, #E7E1D2 50%)",
  "radial-gradient(ellipse 64% 92% at 50% 100%, #4A5560 0 60%, rgba(74,85,96,0) 61%), #DAD3C4",
  "linear-gradient(135deg,#B5623C 0 50%, #2A2723 50%)",
  "linear-gradient(120deg,#34406A 0 60%, #C99A3F 60%)",
  "radial-gradient(circle at 30% 35%, #D8C9A6 0 30%, rgba(216,201,166,0) 30.5%), linear-gradient(#3A4A3F,#2C3A32)",
];

export const AVATAR_COLORS = [
  "#2A2723", "#6E2B2B", "#4A5560", "#6E7355", "#34406A", "#B5623C",
];

// Status colors reference the --pl-* custom properties that lib/theme-css.ts
// sets per-gallery at paint time, rather than a resolved hex value baked in
// at module load — these consumers only ever use bg/fg/dot as inline style
// values, never for comparisons.
export const STATUS_META: Record<SubmissionStatus, { label: string; bg: string; fg: string; dot: string }> = {
  pending:  { label: "Pending review",    bg: "var(--pl-pending-bg)",  fg: "var(--pl-pending-fg)",  dot: "var(--pl-pending-dot)" },
  approved: { label: "Approved",          bg: "var(--pl-approved-bg)", fg: "var(--pl-approved-fg)", dot: "var(--pl-approved-dot)" },
  declined: { label: "Declined",          bg: "var(--pl-declined-bg)", fg: "var(--pl-declined-fg)", dot: "var(--pl-declined-dot)" },
  changes:  { label: "Changes requested", bg: "var(--pl-changes-bg)",  fg: "var(--pl-changes-fg)",  dot: "var(--pl-changes-dot)" },
};

export const EX_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  open:     { label: "Open call",    bg: "var(--pl-approved-bg)", fg: "var(--pl-approved-fg)" },
  planning: { label: "Planning",     bg: "var(--pl-pending-bg)",  fg: "var(--pl-pending-fg)" },
  hanging:  { label: "Hanging now",  bg: "var(--pl-changes-bg)",  fg: "var(--pl-changes-fg)" },
  closed:   { label: "Closed",       bg: "var(--pl-neutral-chip-bg)", fg: "var(--pl-neutral-chip-fg)" },
  archived: { label: "Archived",     bg: "var(--pl-neutral-chip-bg)", fg: "var(--pl-neutral-chip-fg)" },
};

export const EX_TYPE_META: Record<string, string> = {
  group: "Group",
  solo: "Solo",
};

export const CAT_STATUSES: CatalogueStatus[] = ["available", "sold", "reserved", "on loan"];

export const CAT_STATUS_META: Record<CatalogueStatus, { bg: string; fg: string }> = {
  available: { bg: "var(--pl-neutral-chip-bg)", fg: "var(--pl-neutral-chip-fg)" },
  sold:      { bg: "var(--pl-approved-bg)", fg: "var(--pl-approved-fg)" },
  reserved:  { bg: "var(--pl-pending-bg)",  fg: "var(--pl-pending-fg)" },
  "on loan": { bg: "var(--pl-changes-bg)",  fg: "var(--pl-changes-fg)" },
};

export const PAYOUT_STATUSES: PayoutStatus[] = ["due", "paid", "acknowledged", "queried"];

export const PAYOUT_STATUS_META: Record<PayoutStatus, { label: string; bg: string; fg: string }> = {
  due:          { label: "Due",             bg: "var(--pl-neutral-chip-bg)", fg: "var(--pl-neutral-chip-fg)" },
  paid:         { label: "Paid",            bg: "var(--pl-pending-bg)",      fg: "var(--pl-pending-fg)" },
  acknowledged: { label: "Acknowledged",    bg: "var(--pl-approved-bg)",     fg: "var(--pl-approved-fg)" },
  queried:      { label: "Queried",         bg: "var(--pl-declined-bg)",     fg: "var(--pl-declined-fg)" },
};

export const OVERDUE_META = { label: "Overdue", bg: "var(--pl-declined-bg)", fg: "var(--pl-declined-fg)" };

export const FRAME_STAGE_META: Record<string, { label: string; bg: string; fg: string }> = {
  queued:   { label: "Awaiting framing", bg: "var(--pl-pending-bg)",  fg: "var(--pl-pending-fg)" },
  building: { label: "In the frameshop", bg: "var(--pl-changes-bg)",  fg: "var(--pl-changes-fg)" },
  ready:    { label: "Framed & ready",   bg: "var(--pl-approved-bg)", fg: "var(--pl-approved-fg)" },
};
