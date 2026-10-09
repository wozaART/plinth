"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Field } from "@/components/marketing/FormFields";
import { submitResearchResponse } from "@/lib/supabase/research-actions";
import { isTermsQuestionShown, type TermsResult, type TermsValues } from "@/lib/consignment-terms";
import { getResearchForm, researchSections } from "@/lib/research-forms";

const SERIF = "var(--font-newsreader), serif";

export default function ResearchForm({ slug }: { slug: string }) {
  const form = getResearchForm(slug);
  const [values, setValues] = useState<TermsValues>({});
  const [result, setResult] = useState<TermsResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (!form) return null;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        setResult(await submitResearchResponse(slug, formData));
      } catch {
        setResult({ ok: false, message: "We couldn't reach the server. Check your connection and try again.", errors: {} });
      }
    });
  }

  if (result?.ok) {
    const first = values.respondent_name?.trim().split(" ")[0];
    return (
      <div role="status" style={{ background: "var(--pl-approved-panel-bg)", border: "1px solid var(--pl-approved-panel-border)", borderRadius: "var(--pl-radius-card-lg)", padding: "28px 24px" }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: "-.01em", margin: 0 }}>Thank you{first ? `, ${first}` : ""}.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--pl-approved-fg)", margin: "10px 0 0" }}>
          Your answers are saved. You can close this page.
        </p>
      </div>
    );
  }

  const errors = result && !result.ok ? result.errors : {};

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {researchSections(form).map((section) => (
        <section key={section.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: "var(--pl-radius-card-lg)", padding: "22px clamp(16px,4vw,24px) 24px" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, letterSpacing: "-.01em", margin: 0 }}>{section.title}</h2>
          {section.intro && <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--pl-text-muted)", margin: "6px 0 0" }}>{section.intro}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 18 }}>
            {section.questions
              .filter((q) => isTermsQuestionShown(q, values))
              .map((q) => (
                <Field
                  key={q.id}
                  q={q}
                  value={values[q.id] ?? ""}
                  error={errors[q.id]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [q.id]: v }))}
                />
              ))}
          </div>
        </section>
      ))}

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {result && !result.ok && (
        <p role="alert" style={{ background: "var(--pl-declined-panel-bg)", border: "1px solid var(--pl-declined-panel-border)", color: "var(--pl-declined-fg)", borderRadius: "var(--pl-radius-input)", padding: "12px 14px", fontSize: 14, margin: 0 }}>
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 11, padding: "15px 22px", fontFamily: "inherit", fontSize: 16, fontWeight: 500, cursor: pending ? "default" : "pointer", opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "Sending…" : "Send answers"}
      </button>
    </form>
  );
}
