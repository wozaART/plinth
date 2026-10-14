"use client";

import { useState } from "react";
import { STATUS_META } from "@/lib/constants";
import type { Exhibition, Submission } from "@/lib/types";

interface ArchiveExhibitionDialogProps {
  ex: Exhibition;
  submissions: Submission[];
  inCatalogueIds: Set<string>;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (catalogueSubmissionIds: string[]) => void;
}

export default function ArchiveExhibitionDialog({ ex, submissions, inCatalogueIds, saving, onCancel, onConfirm }: ArchiveExhibitionDialogProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const canCatalogue = (s: Submission) => !inCatalogueIds.has(s.id);
  const archivedCount = submissions.filter((s) => !picked.has(s.id) && !inCatalogueIds.has(s.id)).length;

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="anim-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-dialog-title"
      style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "var(--pl-scrim, rgba(23,21,15,.32))" }}
    >
      <div style={{ width: "min(560px,100%)", maxHeight: "88vh", display: "flex", flexDirection: "column", background: "var(--pl-bg-app)", border: "1px solid var(--pl-border)", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--pl-border)" }}>
          <h2 id="archive-dialog-title" style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 550, margin: 0 }}>Archive {ex.title}</h2>
          <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: "6px 0 0", lineHeight: 1.5 }}>
            Choose which submissions go into the catalogue. Works added to the catalogue are no longer linked to this exhibition. Every other submission is archived with it.
          </p>
        </div>

        <div className="scrl" style={{ flex: 1, overflowY: "auto", padding: "14px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
          {submissions.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--pl-text-eyebrow)", padding: "12px 0" }}>This exhibition has no submissions.</div>
          )}
          {submissions.map((s) => {
            const meta = STATUS_META[s.status];
            const inCatalogue = inCatalogueIds.has(s.id);
            const selectable = canCatalogue(s);
            const hint = inCatalogue ? "Already in the catalogue" : null;
            return (
              <label
                key={s.id}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 10, padding: "10px 13px", cursor: selectable ? "pointer" : "default", opacity: 1 }}
              >
                <input
                  type="checkbox"
                  checked={inCatalogue || picked.has(s.id)}
                  disabled={!selectable || saving}
                  onChange={() => toggle(s.id)}
                  aria-label={`Add ${s.title} to catalogue`}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 550 }}>{s.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)" }}>
                    {s.artist}{hint ? ` · ${hint}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: meta.bg, color: meta.fg, whiteSpace: "nowrap" }}>{meta.label}</span>
              </label>
            );
          })}
        </div>

        <div style={{ padding: "14px 22px 18px", borderTop: "1px solid var(--pl-border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontSize: 12.5, color: "var(--pl-text-muted)" }}>
            {picked.size} to catalogue · {archivedCount} to archive
          </div>
          <button onClick={onCancel} disabled={saving} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onConfirm([...picked])}
            disabled={saving}
            style={{ padding: "10px 16px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 550, cursor: saving ? "default" : "pointer" }}
          >
            {saving ? "Archiving…" : "Archive exhibition"}
          </button>
        </div>
      </div>
    </div>
  );
}
