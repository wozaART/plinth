import type { SubmissionStatus } from "./types";
import { galleryConfig } from "./gallery.config";

const statusColors = galleryConfig.theme.colors.status;

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

export const STATUS_META: Record<SubmissionStatus, { label: string; bg: string; fg: string; dot: string }> = {
  pending:  { label: "Pending review",    bg: statusColors.pending.bg,  fg: statusColors.pending.fg,  dot: statusColors.pending.dot },
  approved: { label: "Approved",          bg: statusColors.approved.bg, fg: statusColors.approved.fg, dot: statusColors.approved.dot },
  declined: { label: "Declined",          bg: statusColors.declined.bg, fg: statusColors.declined.fg, dot: statusColors.declined.dot },
  changes:  { label: "Changes requested", bg: statusColors.changes.bg,  fg: statusColors.changes.fg,  dot: statusColors.changes.dot },
};

export const EX_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  open:     { label: "Open call",    bg: statusColors.approved.bg, fg: statusColors.approved.fg },
  planning: { label: "Planning",     bg: statusColors.pending.bg,  fg: statusColors.pending.fg },
  hanging:  { label: "Hanging now",  bg: statusColors.changes.bg,  fg: statusColors.changes.fg },
  closed:   { label: "Closed",       bg: galleryConfig.theme.colors.neutralChipBg, fg: galleryConfig.theme.colors.neutralChipFg },
};

export const CAT_STATUS_META: Record<string, { bg: string; fg: string }> = {
  available: { bg: galleryConfig.theme.colors.neutralChipBg, fg: galleryConfig.theme.colors.neutralChipFg },
  sold:      { bg: statusColors.approved.bg, fg: statusColors.approved.fg },
  reserved:  { bg: statusColors.pending.bg,  fg: statusColors.pending.fg },
  "on loan": { bg: statusColors.changes.bg,  fg: statusColors.changes.fg },
};

export const FRAME_STAGE_META: Record<string, { label: string; bg: string; fg: string }> = {
  queued:   { label: "Awaiting framing", bg: statusColors.pending.bg,  fg: statusColors.pending.fg },
  building: { label: "In the frameshop", bg: statusColors.changes.bg,  fg: statusColors.changes.fg },
  ready:    { label: "Framed & ready",   bg: statusColors.approved.bg, fg: statusColors.approved.fg },
};
