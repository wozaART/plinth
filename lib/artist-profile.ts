// Shared by the artist's profile editor, the server actions and the
// gallery-facing view. The caps mirror the limit triggers in the
// 20261110140000_artist_public_profile migration.

import type { ArtistPublicProfile } from "@/lib/types";

export const MAX_PORTFOLIO_WORKS = 10;
export const MAX_STUDIO_PHOTOS = 6;
export const MAX_LINKS = 10;
export const MAX_BIO_LENGTH = 2000;
export const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024; // matches the artist-profile-images bucket limit

export const PROFILE_IMAGE_BUCKET = "artist-profile-images";

export const LINK_KINDS = [
  { id: "website", label: "Website" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "behance", label: "Behance" },
  { id: "other", label: "Other" },
] as const;

export type ArtistLinkKind = (typeof LINK_KINDS)[number]["id"];

export const isLinkKind = (value: string): value is ArtistLinkKind => LINK_KINDS.some(k => k.id === value);

export const linkKindLabel = (kind: string) => LINK_KINDS.find(k => k.id === kind)?.label ?? "Link";

// Accepts "example.com/me" as well as full URLs; returns null when it can't
// be a web address. Only http(s) is allowed, so a pasted javascript: URL can
// never end up as a link a gallery clicks.
export function normaliseLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname.includes(".")) return null;
  const result = url.toString();
  return result.length <= 500 ? result : null;
}

// The storage object path behind a public bucket URL, so a replaced or
// deleted image can be removed from the bucket too.
export function profileImagePathFromUrl(url: string): string | null {
  const marker = `/${PROFILE_IMAGE_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  return decodeURIComponent(url.slice(at + marker.length).split("?")[0]);
}

export const emptyPublicProfile = (artistId: string, name: string): ArtistPublicProfile => ({
  artistId, name, city: "", practice: "", bio: "", links: [], profilePhoto: null, studioPhotos: [], works: [],
});
