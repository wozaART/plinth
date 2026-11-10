import { createClient } from "@/utils/supabase/client";
import { MAX_PROFILE_IMAGE_BYTES, PROFILE_IMAGE_BUCKET } from "@/lib/artist-profile";

export function checkProfileImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Choose an image file.";
  if (file.size > MAX_PROFILE_IMAGE_BYTES) return "Image must be 10 MB or smaller.";
  return null;
}

// Uploads straight from the browser (server actions cap bodies at 1 MB) to
// {artist_id}/{row_id}/{timestamp}.{ext}. The unique name means a replaced
// image never serves a stale CDN copy. Returns the object path.
export async function uploadProfileImage(rowId: string, file: File): Promise<string> {
  const problem = checkProfileImage(file);
  if (problem) throw new Error(problem);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${rowId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
