"use client";

import { useState, useTransition, type CSSProperties, type FormEvent } from "react";
import { submitConsignmentTerms } from "@/lib/supabase/consignment-terms-actions";
import {
  TERMS_SECTIONS,
  TERMS_TEXT_LIMITS,
  isTermsQuestionShown,
  type TermsQuestion,
  type TermsResult,
  type TermsValues,
} from "@/lib/consignment-terms";

const SERIF = "var(--font-newsreader), serif";

const INPUT: CSSProperties = {
  width: "100%",
  border: "1px solid var(--pl-border-input)",
  borderRadius: "var(--pl-radius-input)",
  padding: "12px 13px",
  fontFamily: "inherit",
  fontSize: 16, // 16px stops iOS zooming the page on focus
  color: "var(--pl-text)",
  background: "var(--pl-surface)",
  boxSizing: "border-box",
};

function Field({
  q,
  value,
  error,
  onChange,
}: {
  q: TermsQuestion;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${q.id}-error`;
  const described = error ? errorId : undefined;
  const label = (
    <>
      {q.label}
      {!q.required && <span style={{ fontWeight: 400, color: "var(--pl-text-soft)" }}> (optional)</span>}
    </>
  );
  const labelStyle: CSSProperties = { display: "block", fontSize: 15, fontWeight: 550, lineHeight: 1.4, color: "var(--pl-text-body)", marginBottom: 9, padding: 0 };

  let control;
  if (q.kind === "choice") {
    control = (
      <fieldset style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }} aria-describedby={described}>
        <legend style={labelStyle}>{label}</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map((o) => {
            const on = value === o.value;
            return (
              <label
                key={o.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "12px 13px",
                  border: `1px solid ${on ? "var(--pl-solid)" : "var(--pl-border-input)"}`,
                  borderRadius: "var(--pl-radius-input)",
                  background: on ? "var(--pl-sidebar)" : "var(--pl-surface)",
                  fontSize: 15,
                  color: "var(--pl-text-body)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={o.value}
                  checked={on}
                  required={q.required}
                  onChange={() => onChange(o.value)}
                  style={{ width: 18, height: 18, margin: 0, flexShrink: 0, accentColor: "var(--pl-solid)" }}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  } else {
    const shared = {
      id: q.id,
      name: q.id,
      value,
      required: q.required,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": described,
    };
    control = (
      <>
        <label htmlFor={q.id} style={labelStyle}>{label}</label>
        {q.kind === "number" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              {...shared}
              type="number"
              inputMode="decimal"
              min={q.min}
              max={q.max}
              step="any"
              onChange={(e) => onChange(e.target.value)}
              style={{ ...INPUT, width: 120 }}
            />
            <span style={{ fontSize: 15, color: "var(--pl-text-secondary)" }}>{q.suffix}</span>
          </div>
        ) : q.kind === "longtext" ? (
          <textarea
            {...shared}
            rows={3}
            maxLength={TERMS_TEXT_LIMITS.longtext}
            placeholder={q.placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }}
          />
        ) : (
          <input
            {...shared}
            type="text"
            maxLength={TERMS_TEXT_LIMITS.text}
            placeholder={q.placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={INPUT}
          />
        )}
      </>
    );
  }

  return (
    <div>
      {control}
      {q.hint && <p style={{ fontSize: 13, color: "var(--pl-text-soft)", margin: "7px 0 0" }}>{q.hint}</p>}
      {error && <p id={errorId} style={{ fontSize: 13, color: "var(--pl-declined-fg)", margin: "7px 0 0" }}>{error}</p>}
    </div>
  );
}

export default function ConsignmentTermsForm({ initial }: { initial: TermsValues }) {
  const [values, setValues] = useState<TermsValues>(initial);
  const [result, setResult] = useState<TermsResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        setResult(await submitConsignmentTerms(formData));
      } catch {
        setResult({ ok: false, message: "We couldn't reach the server. Check your connection and try again.", errors: {} });
      }
    });
  }

  if (result?.ok) {
    return (
      <div role="status" style={{ background: "var(--pl-approved-panel-bg)", border: "1px solid var(--pl-approved-panel-border)", borderRadius: "var(--pl-radius-card-lg)", padding: "28px 24px" }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: "-.01em", margin: 0 }}>Thank you{values.contact_name ? `, ${values.contact_name.split(" ")[0]}` : ""}.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--pl-approved-fg)", margin: "10px 0 0" }}>
          Your answers are saved. You can close this page.
        </p>
      </div>
    );
  }

  const errors = result && !result.ok ? result.errors : {};

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {TERMS_SECTIONS.map((section) => (
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
