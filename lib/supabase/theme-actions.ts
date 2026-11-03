"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { BODY_FONTS, DISPLAY_FONTS, INK_OPTIONS, SIDEBAR_OPTIONS, accentHover, isHexColor, onAccent } from "@/lib/theme-colors";

export async function updateGalleryTheme(formData: FormData) {
  const accent = String(formData.get("accent") || "").trim();
  const fontDisplay = String(formData.get("fontDisplay") || "");
  const fontBody = String(formData.get("fontBody") || "");
  const ink = String(formData.get("ink") || "").trim();
  const sidebar = String(formData.get("sidebar") || "").trim();

  if (!isHexColor(accent)) throw new Error(`"${accent}" isn't a valid colour. Use a hex value like #B5623C.`);
  if (!Object.hasOwn(DISPLAY_FONTS, fontDisplay)) throw new Error("Choose a heading font from the list.");
  if (!Object.hasOwn(BODY_FONTS, fontBody)) throw new Error("Choose a body font from the list.");

  const supabase = createClient(await cookies());
  const gallery = await getCurrentGallery(supabase);

  // Ink and sidebar only make sense on a light base; dark galleries keep theirs.
  const light = gallery.theme_mode === "light";
  if (light && !(INK_OPTIONS.some(o => o.color === ink) && SIDEBAR_OPTIONS.some(o => o.color === sidebar))) {
    throw new Error("Choose an ink and sidebar tint from the list.");
  }

  // Only the brand colours change; the rest of the palette (surfaces, text,
  // status colours) stays as the gallery's light/dark base.
  const themeColors = {
    ...(gallery.theme_colors as Record<string, unknown>),
    accent,
    accentHover: accentHover(accent),
    onAccent: onAccent(accent),
    ...(light && { solid: ink, surfaceDark: ink, text: ink, sidebar }),
  };

  const { error } = await supabase
    .from("galleries")
    .update({
      theme_colors: themeColors,
      font_display: DISPLAY_FONTS[fontDisplay],
      font_body: BODY_FONTS[fontBody],
    })
    .eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/", "layout");
}
