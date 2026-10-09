import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import type { Database } from "./database.types";

export type GalleryRow = Database["public"]["Tables"]["galleries"]["Row"];

const DEFAULT_GALLERY_SLUG = process.env.DEFAULT_GALLERY_SLUG ?? "default";

/**
 * Resolves the gallery for the current request. The slug is set by
 * proxy.ts (x-gallery-slug), which matches the request's host against
 * galleries.custom_domain or the <slug>.<apex> subdomain pattern — this is
 * what lets one deployment serve every gallery. Falls back to
 * DEFAULT_GALLERY_SLUG for requests that bypass middleware (e.g. server
 * actions invoked without that header).
 *
 * When the host doesn't point at a specific gallery (i.e. resolves to the
 * default tenant), a signed-in gallery owner gets their own gallery instead
 * of the default tenant's.
 */
export async function getCurrentGallery(supabase: SupabaseClient<Database>): Promise<GalleryRow> {
  const requestHeaders = await headers();
  const slug = requestHeaders.get("x-gallery-slug") ?? DEFAULT_GALLERY_SLUG;

  if (slug === DEFAULT_GALLERY_SLUG) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: owned } = await supabase
        .from("galleries")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (owned) return owned;
    }
  }

  const { data, error } = await supabase
    .from("galleries")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(`No gallery found for slug "${slug}": ${error?.message ?? "no row"}`);
  }
  return data;
}
