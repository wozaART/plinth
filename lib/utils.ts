import type { CSSProperties } from "react";
import { ARTWORK_GRADIENTS, AVATAR_COLORS } from "./constants";

export function artworkBg(index: number): string {
  return ARTWORK_GRADIENTS[index % ARTWORK_GRADIENTS.length];
}

// Uploaded artwork photo when there is one, otherwise the placeholder gradient.
export function artworkFill(imageUrl: string | undefined, index: number): CSSProperties {
  return imageUrl
    ? { backgroundImage: `url(${JSON.stringify(imageUrl)})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--pl-sidebar)" }
    : { background: artworkBg(index) };
}

export function avatarBg(index: number): string {
  const c = AVATAR_COLORS;
  return `linear-gradient(135deg,${c[index % c.length]},#57534A)`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function relativeTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  if (then.toDateString() === now.toDateString()) return "Today";

  const day = 86400;
  const week = day * 7;
  const diffSec = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));

  if (diffSec < day * 2) return "Yesterday";
  if (diffSec < week) return `${Math.floor(diffSec / day)} days ago`;

  const weeks = Math.floor(diffSec / week);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  return then.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
