import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { galleryConfig } from "@/lib/gallery.config";

export type GalleryRow = Database["public"]["Tables"]["galleries"]["Row"];

export async function getCurrentGallery(supabase: SupabaseClient<Database>): Promise<GalleryRow> {
  const { data, error } = await supabase
    .from("galleries")
    .select("*")
    .eq("slug", galleryConfig.identity.slug)
    .single();

  if (error || !data) {
    throw new Error(`No gallery found for slug "${galleryConfig.identity.slug}": ${error?.message ?? "no row"}`);
  }
  return data;
}
