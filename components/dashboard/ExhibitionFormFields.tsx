"use client";

import type { CSSProperties } from "react";
import type { ExhibitionAccess, ExhibitionType } from "@/lib/types";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

export interface ExhibitionFormState {
  title: string;
  type: ExhibitionType;
  access: ExhibitionAccess;
  blurb: string;
  theme: string;
  mediumRequirements: string;
  sizeRequirements: string;
  rules: string;
  slots: string;
  submissionDeadline: string;
  openingDate: string;
  closingDate: string;
  deliveryDate: string;
}

export const EMPTY_EXHIBITION_FORM: ExhibitionFormState = {
  title: "",
  type: "group",
  access: "open",
  blurb: "",
  theme: "",
  mediumRequirements: "",
  sizeRequirements: "",
  rules: "",
  slots: "8",
  submissionDeadline: "",
  openingDate: "",
  closingDate: "",
  deliveryDate: "",
};

export default function ExhibitionFormFields({
  form,
  onChange,
  requireDates = false,
}: {
  form: ExhibitionFormState;
  onChange: (patch: Partial<ExhibitionFormState>) => void;
  requireDates?: boolean;
}) {
  const required = requireDates ? (
    <span style={{ display: "block", color: "var(--pl-declined-fg)", textTransform: "none", letterSpacing: 0, marginTop: 2 }}>required</span>
  ) : null;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>Type</label>
        <div style={{ display: "flex", gap: 9 }}>
          {(["group", "solo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ type: t })}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 550, cursor: "pointer",
                border: "1px solid", borderColor: form.type === t ? "var(--pl-solid)" : "var(--pl-border-strong)",
                background: form.type === t ? "var(--pl-solid)" : "var(--pl-surface)",
                color: form.type === t ? "var(--pl-on-solid)" : "var(--pl-text-muted)",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>Who can enter</label>
        <div style={{ display: "flex", gap: 9 }}>
          {([["open", "Open call"], ["closed", "Invite only"]] as const).map(([a, label]) => (
            <button
              key={a}
              onClick={() => onChange({ access: a })}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 550, cursor: "pointer",
                border: "1px solid", borderColor: form.access === a ? "var(--pl-solid)" : "var(--pl-border-strong)",
                background: form.access === a ? "var(--pl-solid)" : "var(--pl-surface)",
                color: form.access === a ? "var(--pl-on-solid)" : "var(--pl-text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--pl-text-faint)", marginTop: 7 }}>
          {form.access === "open" ? "Any artist in your portal can see this and submit." : "Hidden from open calls. Only artists you invite can submit."}
        </div>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Title <span style={{ color: "var(--pl-declined-fg)", textTransform: "none", letterSpacing: 0 }}>required</span></span>
        <input value={form.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Highveld Light" style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Blurb <span style={{ color: "var(--pl-text-faint)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>optional</span></span>
        <input value={form.blurb} onChange={(e) => onChange({ blurb: e.target.value })} placeholder="Short one-line description" style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Theme</span>
        <input value={form.theme} onChange={(e) => onChange({ theme: e.target.value })} placeholder="e.g. Landscape & memory of the interior" style={inputStyle} />
      </label>

      <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Medium requirements</span>
          <input value={form.mediumRequirements} onChange={(e) => onChange({ mediumRequirements: e.target.value })} placeholder="e.g. Oil or acrylic only" style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Size requirements</span>
          <input value={form.sizeRequirements} onChange={(e) => onChange({ sizeRequirements: e.target.value })} placeholder="e.g. Max 150cm on longest edge" style={inputStyle} />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Rules for entering</span>
        <textarea
          value={form.rules}
          onChange={(e) => onChange({ rules: e.target.value })}
          rows={4}
          placeholder="What artists must understand before submitting or accepting an invite…"
          style={{ ...inputStyle, resize: "none" as const }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Slots</span>
        <input type="number" min={0} value={form.slots} onChange={(e) => onChange({ slots: e.target.value })} style={inputStyle} />
      </label>

      <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Online submission deadline{required}</span>
          <input type="date" required={requireDates} value={form.submissionDeadline} onChange={(e) => onChange({ submissionDeadline: e.target.value })} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Delivery date{required}</span>
          <input type="date" required={requireDates} value={form.deliveryDate} onChange={(e) => onChange({ deliveryDate: e.target.value })} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Opening date{required}</span>
          <input type="date" required={requireDates} value={form.openingDate} onChange={(e) => onChange({ openingDate: e.target.value })} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Closing date{required}</span>
          <input type="date" required={requireDates} value={form.closingDate} onChange={(e) => onChange({ closingDate: e.target.value })} style={inputStyle} />
        </label>
      </div>
    </div>
  );
}
