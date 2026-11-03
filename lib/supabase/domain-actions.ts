"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { deleteMailDomain } from "@/lib/resend/domains";
import { addDomainToProject, removeDomainFromProject, getDomainStatus, dnsInstructionsFor } from "@/lib/vercel/domains";

async function supabaseServer() {
  return createClient(await cookies());
}

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

export async function connectCustomDomain(formData: FormData) {
  const domain = String(formData.get("domain") || "").trim().toLowerCase();
  if (!DOMAIN_RE.test(domain)) throw new Error(`"${domain}" doesn't look like a valid domain.`);

  const supabase = await supabaseServer();
  const gallery = await getCurrentGallery(supabase);

  await addDomainToProject(domain);

  const { error } = await supabase
    .from("galleries")
    .update({ custom_domain: domain, domain_status: "pending" })
    .eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/dashboard");
  return dnsInstructionsFor(domain);
}

export async function refreshDomainStatus() {
  const supabase = await supabaseServer();
  const gallery = await getCurrentGallery(supabase);
  if (!gallery.custom_domain) return;

  const status = await getDomainStatus(gallery.custom_domain);
  const domain_status = status.verified && !status.misconfigured ? "verified" : "pending";

  const { error } = await supabase.from("galleries").update({ domain_status }).eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/dashboard");
}

export async function disconnectCustomDomain() {
  const supabase = await supabaseServer();
  const gallery = await getCurrentGallery(supabase);
  if (!gallery.custom_domain) return;

  await removeDomainFromProject(gallery.custom_domain);
  // The mail domain is the custom domain, so it goes with it.
  if (gallery.resend_domain_id) await deleteMailDomain(gallery.resend_domain_id);

  const { error } = await supabase
    .from("galleries")
    .update({ custom_domain: null, domain_status: "none", resend_domain_id: null, mail_domain_status: "none" })
    .eq("id", gallery.id);
  if (error) throw error;

  revalidatePath("/dashboard");
}
