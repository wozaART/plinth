// Server-side validation for the public forms (consignment terms and the
// research forms). Every value is checked against the question list, so the
// client can never submit an answer a question doesn't allow.

import {
  TERMS_TEXT_LIMITS,
  isTermsQuestionShown,
  type TermsQuestion,
  type TermsValues,
} from "@/lib/consignment-terms";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAnswers(
  questions: TermsQuestion[],
  formData: FormData,
  emailIds: string[] = [],
): { values: TermsValues; errors: Record<string, string> } {
  const raw: TermsValues = {};
  for (const q of questions) raw[q.id] = String(formData.get(q.id) ?? "").trim();

  const values: TermsValues = {};
  const errors: Record<string, string> = {};

  for (const q of questions) {
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

  for (const id of emailIds) {
    if (values[id] && !EMAIL_RE.test(values[id])) errors[id] = "Enter a valid email address.";
  }

  return { values, errors };
}
