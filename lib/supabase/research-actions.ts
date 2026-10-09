"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { type TermsResult } from "@/lib/consignment-terms";
import { validateAnswers } from "@/lib/form-validation";
import { getResearchForm, researchQuestions } from "@/lib/research-forms";

// Public: respondents have no Woza Art account, so there is no auth check.
// Every value is validated against the form's question list, and the table
// accepts inserts only.
export async function submitResearchResponse(slug: string, formData: FormData): Promise<TermsResult> {
  // Honeypot: a real visitor never sees or fills this field.
  if (String(formData.get("website") || "")) return { ok: true };

  const form = getResearchForm(slug);
  if (!form) return { ok: false, message: "We couldn't find that form.", errors: {} };

  const { values, errors } = validateAnswers(researchQuestions(form), formData, ["respondent_email"]);

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "A few answers need another look.", errors };
  }

  const { respondent_name, respondent_role, respondent_email, ...answers } = values;

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("research_responses").insert({
    form_slug: form.slug,
    respondent_name,
    respondent_role,
    respondent_email: respondent_email || null,
    answers,
  });

  if (error) {
    console.error("submitResearchResponse failed", error);
    return { ok: false, message: "We couldn't save your answers. Please try again.", errors: {} };
  }

  return { ok: true };
}
