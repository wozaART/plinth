import type { SubmissionStatus } from "./types";

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
  pending:  { label: "Pending review",    bg: "#F4ECD9", fg: "#8A6A1E", dot: "#C2922F" },
  approved: { label: "Approved",          bg: "#E7EFE1", fg: "#4A6138", dot: "#6B8A4E" },
  declined: { label: "Declined",          bg: "#F3E4E0", fg: "#8A3A30", dot: "#B04A3C" },
  changes:  { label: "Changes requested", bg: "#E6EBEF", fg: "#3C566B", dot: "#5A7894" },
};

export const EX_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  open:     { label: "Open call",    bg: "#E7EFE1", fg: "#4A6138" },
  planning: { label: "Planning",     bg: "#F4ECD9", fg: "#8A6A1E" },
  hanging:  { label: "Hanging now",  bg: "#E6EBEF", fg: "#3C566B" },
  closed:   { label: "Closed",       bg: "#EEEAE0", fg: "#8B8579" },
};

export const CAT_STATUS_META: Record<string, { bg: string; fg: string }> = {
  available: { bg: "#EEEAE0", fg: "#57534A" },
  sold:      { bg: "#E7EFE1", fg: "#4A6138" },
  reserved:  { bg: "#F4ECD9", fg: "#8A6A1E" },
  "on loan": { bg: "#E6EBEF", fg: "#3C566B" },
};
