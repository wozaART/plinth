"use client";

import type { CSSProperties } from "react";
import { TERMS_TEXT_LIMITS, type TermsQuestion } from "@/lib/consignment-terms";

export const INPUT: CSSProperties = {
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

export function Field({
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
