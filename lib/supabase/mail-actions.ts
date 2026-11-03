"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";

// Mirrors the check constraints on galleries.mail_local_part / reply_to_email.
const LOCAL_PART_RE = /^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Addresses people expect to be role mailboxes, not a gallery's own.
const RESERVED_LOCAL_PARTS = new Set([
  "abuse", "admin", "administrator", "billing", "hostmaster", "mailer-daemon", "noreply", "no-reply",
  "postmaster", "root", "security", "support", "webmaster",
]);

export async function updateGalleryMail(formData: FormData) {
  const localPart = String(formData.get("localPart") || "").trim().toLowerCase();
  const replyTo = String(formData.get("replyTo") || "").trim();

  if (localPart && !LOCAL_PART_RE.test(localPart)) {
    throw new Error("Use lowercase letters, numbers and hyphens only (up to 32 characters, not starting or ending with a hyphen).");
  }
  if (RESERVED_LOCAL_PARTS.has(localPart)) throw new Error(`"${localPart}" is reserved. Choose another address.`);
  if (replyTo && !EMAIL_RE.test(replyTo)) throw new Error(`"${replyTo}" isn't a valid email address.`);

  const supabase = createClient(await cookies());
  const gallery = await getCurrentGallery(supabase);

  // An empty field clears the setting, which sends mail from the platform address again.
  const { error } = await supabase
    .from("galleries")
    .update({ mail_local_part: localPart || null, reply_to_email: replyTo || null })
    .eq("id", gallery.id);
  if (error) {
    if (error.code === "23505") throw new Error(`"${localPart}" is already taken by another gallery.`);
    throw error;
  }

  revalidatePath("/", "layout");
}
