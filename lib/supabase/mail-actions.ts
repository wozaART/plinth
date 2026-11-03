"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { createMailDomain, deleteMailDomain, refreshMailDomain, type MailDnsRecord } from "@/lib/resend/domains";

// Mirrors the check constraints on galleries.mail_local_part / reply_to_email.
const LOCAL_PART_RE = /^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Role mailboxes people expect to belong to the domain owner, not a gallery.
const RESERVED_LOCAL_PARTS = new Set([
  "abuse", "admin", "administrator", "billing", "hostmaster", "mailer-daemon", "noreply", "no-reply",
  "postmaster", "root", "security", "support", "webmaster",
]);

async function ownGallery() {
  const supabase = createClient(await cookies());
  return { supabase, gallery: await getCurrentGallery(supabase) };
}

/** Registers the gallery's custom domain with Resend so mail can be sent from it. */
export async function setUpMailDomain(): Promise<MailDnsRecord[]> {
  const { supabase, gallery } = await ownGallery();
  if (!gallery.custom_domain) throw new Error("Connect a custom domain first.");
  if (gallery.resend_domain_id) throw new Error("Email is already set up for this domain.");

  const mailDomain = await createMailDomain(gallery.custom_domain);

  const { error } = await supabase
    .from("galleries")
    .update({ resend_domain_id: mailDomain.id, mail_domain_status: mailDomain.status })
    .eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/dashboard");
  return mailDomain.records;
}

/** Re-checks DNS with Resend. Returns the current status and the records still to add. */
export async function refreshMailDomainStatus(): Promise<{ status: string; records: MailDnsRecord[] }> {
  const { supabase, gallery } = await ownGallery();
  if (!gallery.resend_domain_id) throw new Error("Email isn't set up for this domain yet.");

  const mailDomain = await refreshMailDomain(gallery.resend_domain_id);

  const { error } = await supabase.from("galleries").update({ mail_domain_status: mailDomain.status }).eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/dashboard");
  return { status: mailDomain.status, records: mailDomain.records };
}

export async function removeMailDomain() {
  const { supabase, gallery } = await ownGallery();
  if (!gallery.resend_domain_id) return;

  await deleteMailDomain(gallery.resend_domain_id);

  const { error } = await supabase
    .from("galleries")
    .update({ resend_domain_id: null, mail_domain_status: "none" })
    .eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/dashboard");
}

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
  if (error) throw error;

  revalidatePath("/", "layout");
}
