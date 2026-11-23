"use client";

import { useState, type CSSProperties } from "react";
import { useGalleryConfig } from "@/lib/gallery-context";
import { parseLimit } from "@/lib/exhibition-limits";
import type { ExhibitionAccess, ExhibitionLimits, ExhibitionType } from "@/lib/types";
import type { ExhibitionInput } from "@/lib/supabase/actions";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

export const MAX_TERMS_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_TERMS_TEXT_CHARS = 20000;

export type TermsMode = "none" | "text" | "pdf";

// What the form hands up: the exhibition fields plus a terms PDF that still
// has to be uploaded (the file goes browser-direct to Storage, not through
// the action).
export type ExhibitionFormInput = ExhibitionInput & { consignmentTermsPdfFile?: File | null };

export interface ExhibitionFormState {
  title: string;
  type: ExhibitionType;
  access: ExhibitionAccess;
  blurb: string;
  theme: string;
  mediumRequirements: string;
  // Free text from before the structured limits; only editable where it exists.
  sizeRequirements: string;
  maxHeightCm: string;
  maxLengthCm: string;
  maxWidthCm: string;
  maxWeightExclPackagingKg: string;
  maxWeightInclPackagingKg: string;
  rules: string;
  termsMode: TermsMode;
  termsText: string;
  termsPdfFile: File | null;
  // Path of the PDF already attached to the exhibition, if any.
  termsPdfPath: string | null;
  maxWorksPerArtist: string;
  // Blank = use the gallery's default commission.
  commissionRatePct: string;
  submissionDeadline: string;
  openingDate: string;
  closingDate: string;
  deliveryDate: string;
}

// Only the terms fields of the input. In PDF mode with a new file the text and
// path are left out: the file is uploaded first and the path attached after,
// so a failed upload doesn't wipe the terms already in place.
export function termsInput(form: ExhibitionFormState): Pick<ExhibitionFormInput, "consignmentTermsText" | "consignmentTermsPdfPath" | "consignmentTermsPdfFile"> {
  if (form.termsMode === "text" && form.termsText.trim()) {
    return { consignmentTermsText: form.termsText.trim() };
  }
  if (form.termsMode === "pdf") {
    if (form.termsPdfFile) return { consignmentTermsPdfFile: form.termsPdfFile };
    if (form.termsPdfPath) return { consignmentTermsPdfPath: form.termsPdfPath };
  }
  return { consignmentTermsText: "", consignmentTermsPdfPath: null };
}

export function termsModeOf(text: string, pdfPath: string | null): TermsMode {
  return pdfPath ? "pdf" : text ? "text" : "none";
}

export const EMPTY_EXHIBITION_FORM: ExhibitionFormState = {
  title: "",
  type: "group",
  access: "open",
  blurb: "",
  theme: "",
  mediumRequirements: "",
  sizeRequirements: "",
  maxHeightCm: "",
  maxLengthCm: "",
  maxWidthCm: "",
  maxWeightExclPackagingKg: "",
  maxWeightInclPackagingKg: "",
  rules: "",
  termsMode: "none",
  termsText: "",
  termsPdfFile: null,
  termsPdfPath: null,
  maxWorksPerArtist: "",
  commissionRatePct: "",
  submissionDeadline: "",
  openingDate: "",
  closingDate: "",
  deliveryDate: "",
};

// Blank (or out of range) means "use the gallery default".
export function commissionInput(form: Pick<ExhibitionFormState, "commissionRatePct">): number | null {
  const raw = form.commissionRatePct.trim();
  const n = Number(raw);
  return raw && Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 10) / 10 : null;
}

export function limitsInput(form: Pick<ExhibitionFormState, keyof ExhibitionLimits>): ExhibitionLimits {
  return {
    maxHeightCm: parseLimit(form.maxHeightCm),
    maxLengthCm: parseLimit(form.maxLengthCm),
    maxWidthCm: parseLimit(form.maxWidthCm),
    maxWeightExclPackagingKg: parseLimit(form.maxWeightExclPackagingKg),
    maxWeightInclPackagingKg: parseLimit(form.maxWeightInclPackagingKg),
  };
}

type LimitField = readonly [keyof ExhibitionLimits, string];

const SIZE_FIELDS: readonly LimitField[] = [
  ["maxHeightCm", "Height (cm)"],
  ["maxLengthCm", "Length (cm)"],
  ["maxWidthCm", "Width (cm)"],
];
const WEIGHT_FIELDS: readonly LimitField[] = [
  ["maxWeightExclPackagingKg", "Excluding packaging (kg)"],
  ["maxWeightInclPackagingKg", "Including packaging / crating (kg)"],
];

function LimitGroup({ title, hint, fields, form, onChange }: {
  title: string;
  hint: string;
  fields: readonly LimitField[];
  form: ExhibitionFormState;
  onChange: (patch: Partial<ExhibitionFormState>) => void;
}) {
  return (
    <div role="group" aria-label={title}>
      <div style={labelStyle}>{title}</div>
      <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))`, gap: 12, marginTop: 8 }}>
        {fields.map(([key, label]) => (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, color: "var(--pl-text-soft)" }}>{label}</span>
            <input type="number" min={0} step="any" value={form[key]} placeholder="No limit" onChange={(e) => onChange({ [key]: e.target.value })} style={inputStyle} />
          </label>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "var(--pl-text-faint)", marginTop: 7 }}>{hint}</div>
    </div>
  );
}

export default function ExhibitionFormFields({
  form,
  onChange,
  requireDates = false,
}: {
  form: ExhibitionFormState;
  onChange: (patch: Partial<ExhibitionFormState>) => void;
  requireDates?: boolean;
}) {
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Decided on mount so the field doesn't vanish while it's being cleared.
  const [hasSizeNotes] = useState(form.sizeRequirements !== "");
  const { business } = useGalleryConfig();

  function pickPdf(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf") return setPdfError("Please choose a PDF file.");
    if (file.size > MAX_TERMS_PDF_BYTES) return setPdfError("That PDF is over 10 MB.");
    setPdfError(null);
    onChange({ termsPdfFile: file });
  }

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

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Medium</span>
        <input value={form.mediumRequirements} onChange={(e) => onChange({ mediumRequirements: e.target.value })} placeholder="e.g. Oil or acrylic only" style={inputStyle} />
      </label>

      <LimitGroup title="Size requirements" hint="Largest work accepted: height × length × width. Leave blank for no limit." fields={SIZE_FIELDS} form={form} onChange={onChange} />
      {hasSizeNotes && (
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Size notes</span>
          <input value={form.sizeRequirements} onChange={(e) => onChange({ sizeRequirements: e.target.value })} style={inputStyle} />
        </label>
      )}
      <LimitGroup title="Weight" hint="Heaviest work accepted. Leave blank for no limit." fields={WEIGHT_FIELDS} form={form} onChange={onChange} />

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

      <div>
        <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>Consignment terms <span style={{ color: "var(--pl-text-faint)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>optional</span></label>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {([["none", "None"], ["text", "Type or paste"], ["pdf", "Upload PDF"]] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ termsMode: m })}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 550, cursor: "pointer",
                border: "1px solid", borderColor: form.termsMode === m ? "var(--pl-solid)" : "var(--pl-border-strong)",
                background: form.termsMode === m ? "var(--pl-solid)" : "var(--pl-surface)",
                color: form.termsMode === m ? "var(--pl-on-solid)" : "var(--pl-text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {form.termsMode === "none" && (
          <div style={{ fontSize: 12, color: "var(--pl-text-faint)", marginTop: 7 }}>Artists can submit without agreeing to any terms.</div>
        )}
        {form.termsMode === "text" && (
          <textarea
            aria-label="Consignment terms"
            value={form.termsText}
            onChange={(e) => onChange({ termsText: e.target.value })}
            rows={8}
            maxLength={MAX_TERMS_TEXT_CHARS}
            placeholder="Commission, payout timing, insurance, how unsold work is collected…"
            style={{ ...inputStyle, resize: "vertical" as const, marginTop: 10 }}
          />
        )}
        {form.termsMode === "pdf" && (
          <div style={{ marginTop: 10 }}>
            <input
              type="file"
              accept="application/pdf"
              aria-label="Consignment terms PDF"
              onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13, fontFamily: "inherit", color: "var(--pl-text)" }}
            />
            <div style={{ fontSize: 12, color: pdfError ? "var(--pl-declined-fg)" : "var(--pl-text-faint)", marginTop: 7 }}>
              {pdfError ?? (form.termsPdfFile ? `Will upload ${form.termsPdfFile.name}` : form.termsPdfPath ? "A PDF is attached. Choose a file to replace it." : "PDF, up to 10 MB.")}
            </div>
          </div>
        )}
        {form.termsMode !== "none" && (
          <div style={{ fontSize: 12, color: "var(--pl-text-faint)", marginTop: 7 }}>
            Artists must agree to these before submitting. Changing them later won&apos;t affect artists who have already agreed.
          </div>
        )}
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Maximum works submitted</span>
        <input type="number" min={1} value={form.maxWorksPerArtist} placeholder="No limit" onChange={(e) => onChange({ maxWorksPerArtist: e.target.value })} style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={labelStyle}>Commission (%)</span>
        <input type="number" min={0} max={100} step="any" value={form.commissionRatePct} placeholder={`Gallery default (${Math.round(business.commissionRate * 1000) / 10}%)`} onChange={(e) => onChange({ commissionRatePct: e.target.value })} style={inputStyle} />
        <span style={{ fontSize: 12, color: "var(--pl-text-faint)" }}>Added on top of each artist&apos;s asking price. Leave blank to use the gallery default.</span>
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
