"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  TERMS_QUESTIONS,
  TERMS_TEXT_LIMITS,
  isTermsQuestionShown,
  type TermsResult,
  type TermsValues,
} from "@/lib/consignment-terms";
import { isDemoUser } from "@/lib/demo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: the respondent is a gallery with no Woza Art account, so there is no
// auth check. Every value is validated against the question list, and the
// table accepts inserts only.
export async function submitConsignmentTerms(formData: FormData): Promise<TermsResult> {
  // Honeypot: a real visitor never sees or fills this field.
  if (String(formData.get("website") || "")) return { ok: true };

  const raw: TermsValues = {};
  for (const q of TERMS_QUESTIONS) raw[q.id] = String(formData.get(q.id) ?? "").trim();

  const values: TermsValues = {};
  const errors: Record<string, string> = {};

  for (const q of TERMS_QUESTIONS) {
    if (!isTermsQuestionShown(q, raw)) continue;
    const value = raw[q.id];

    if (!value) {
      if (q.required) errors[q.id] = "Please answer this one.";
      continue;
    }

    if (q.kind === "choice") {
      if (!q.options.some((o) => o.value === value)) errors[q.id] = "Pick one of the options.";
    } else if (q.kind === "number") {
      const n = Number(value.replace(",", "."));
      if (!Number.isFinite(n) || n < q.min || n > q.max) {
        errors[q.id] = `Enter a number from ${q.min} to ${q.max}.`;
        continue;
      }
      values[q.id] = String(n);
      continue;
    } else if (value.length > TERMS_TEXT_LIMITS[q.kind]) {
      errors[q.id] = `Keep this under ${TERMS_TEXT_LIMITS[q.kind]} characters.`;
    }

    if (!errors[q.id]) values[q.id] = value;
  }

  if (values.contact_email && !EMAIL_RE.test(values.contact_email)) {
    errors.contact_email = "Enter a valid email address.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "A few answers need another look.", errors };
  }

  const { gallery_name, contact_name, contact_role, contact_email, ...answers } = values;

  const supabase = createClient(await cookies());
  const { data: inserted, error } = await supabase
    .from("consignment_terms_responses")
    .insert({
      gallery_name,
      contact_name,
      contact_role: contact_role || null,
      contact_email,
      answers,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("submitConsignmentTerms failed", error);
    return { ok: false, message: "We couldn't save your answers. Please try again.", errors: {} };
  }

  // Best-effort: the respondent should still see "thank you" even if the
  // notification email fails — the row is saved either way.
  supabase.functions
    .invoke("notify-consignment-terms-response", {
      body: {
        responseId: inserted.id,
        galleryName: gallery_name,
        contactName: contact_name,
        contactEmail: contact_email,
        answers,
      },
    })
    .catch((err) => console.error("notify-consignment-terms-response failed", err));

  return { ok: true };
}

// ── Platform-owner review & follow-up ───────────────────────────────────

async function requireAppUrl(): Promise<string> {
  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    appUrl = `${protocol}://${host}`;
  }
  return appUrl;
}

export async function markConsignmentResponseReviewed(id: string) {
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("consignment_terms_responses").update({ status: "reviewed" }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/consignment-terms");
}

export async function sendConsignmentTermsFollowup(id: string, message: string) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (isDemoUser(user)) return { demo: true };
  const { data, error } = await supabase.functions.invoke("send-consignment-terms-followup", {
    body: { responseId: id, message },
  });

  if (error) {
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);

  revalidatePath("/admin/consignment-terms");
  return data;
}

export async function sendConsignmentTermsInvite(input: { contactName: string; contactEmail: string }) {
  const supabase = createClient(await cookies());
  const appUrl = await requireAppUrl();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  if (isDemoUser(user)) return { demo: true };

  const { data, error } = await supabase.functions.invoke("send-consignment-terms-invite", {
    body: {
      appUrl,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
    },
  });

  if (error) {
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);

  return data;
}
