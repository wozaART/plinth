import { ARTWORK_GRADIENTS, AVATAR_COLORS } from "./constants";

export function artworkBg(index: number): string {
  return ARTWORK_GRADIENTS[index % ARTWORK_GRADIENTS.length];
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
