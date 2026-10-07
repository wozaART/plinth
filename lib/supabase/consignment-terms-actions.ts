"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  TERMS_QUESTIONS,
  TERMS_TEXT_LIMITS,
  isTermsQuestionShown,
  type TermsResult,
  type TermsValues,
} from "@/lib/consignment-terms";

// Public: the respondent is a gallery with no Plinth account, so there is no
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

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "A few answers need another look.", errors };
  }

  const { gallery_name, contact_name, contact_role, ...answers } = values;

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("consignment_terms_responses").insert({
    gallery_name,
    contact_name,
    contact_role: contact_role || null,
    answers,
  });

  if (error) {
    console.error("submitConsignmentTerms failed", error);
    return { ok: false, message: "We couldn't save your answers. Please try again.", errors: {} };
  }

  return { ok: true };
}
