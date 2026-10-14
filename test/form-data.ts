import type { TermsQuestion } from "@/lib/consignment-terms";

/** A FormData that answers every question validly; `overrides` replace or (with "") blank answers. */
export function validFormData(questions: TermsQuestion[], overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  for (const q of questions) {
    fd.set(q.id, q.kind === "choice" ? q.options[0].value : q.kind === "number" ? String(q.min) : "answer");
  }
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}
