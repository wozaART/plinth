"use client";

import { useState } from "react";
import ExhibitionFormFields, { EMPTY_EXHIBITION_FORM, type ExhibitionFormState } from "./ExhibitionFormFields";
import type { ExhibitionInput } from "@/lib/supabase/actions";

interface CreateExhibitionDrawerProps {
  onClose: () => void;
  onCreate: (input: ExhibitionInput) => void;
}

export default function CreateExhibitionDrawer({ onClose, onCreate }: CreateExhibitionDrawerProps) {
  const [form, setForm] = useState<ExhibitionFormState>(EMPTY_EXHIBITION_FORM);

  const ready = form.title.trim().length > 0;

  function submit() {
    if (!ready) return;
    onCreate({
      title: form.title.trim(),
      type: form.type,
      blurb: form.blurb.trim(),
      theme: form.theme.trim(),
      mediumRequirements: form.mediumRequirements.trim(),
      sizeRequirements: form.sizeRequirements.trim(),
      rules: form.rules.trim(),
      slots: Number(form.slots) || 0,
      submissionDeadline: form.submissionDeadline || null,
      openingDate: form.openingDate || null,
      closingDate: form.closingDate || null,
      deliveryDate: form.deliveryDate || null,
    });
  }

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer scrl" style={{ width: "min(560px,94vw)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--pl-bg-app)", borderBottom: "1px solid var(--pl-border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)" }}>Exhibitions</div>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: "3px 0 0", letterSpacing: "-.015em" }}>New exhibition</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text)", flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: "24px 24px 32px" }}>
          <ExhibitionFormFields form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />

          <div style={{ display: "flex", gap: 13, alignItems: "center", marginTop: 24 }}>
            <button
              onClick={submit}
              disabled={!ready}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", background: ready ? "var(--pl-solid)" : "var(--pl-border-strong)", color: ready ? "var(--pl-on-solid)" : "var(--pl-text-faint)" }}
            >
              Create exhibition
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
