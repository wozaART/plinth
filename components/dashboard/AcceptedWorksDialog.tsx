"use client";

import { useEffect, useState } from "react";
import ImageLightbox from "@/components/shared/ImageLightbox";
import type { Exhibition, Submission } from "@/lib/types";

interface AcceptedWorksDialogProps {
  ex: Exhibition;
  works: Submission[];
  onClose: () => void;
}

export default function AcceptedWorksDialog({ ex, works, onClose }: AcceptedWorksDialogProps) {
  const [zoomed, setZoomed] = useState<Submission | null>(null);

  useEffect(() => {
    if (zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, zoomed]);

  return (
    <>
    <div
      className="anim-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accepted-works-title"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "var(--pl-scrim, rgba(23,21,15,.32))" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(760px,100%)", maxHeight: "90vh", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--pl-bg-app)", border: "1px solid var(--pl-border)", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 14px", borderBottom: "1px solid var(--pl-border)" }}>
          <div>
            <h2 id="accepted-works-title" style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 550, margin: 0 }}>Accepted works ({works.length})</h2>
            <div style={{ fontSize: 13, color: "var(--pl-text-muted)", marginTop: 4 }}>{ex.title}</div>
          </div>
          <button onClick={onClose} aria-label="Close accepted works" style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", fontSize: 17, cursor: "pointer", color: "var(--pl-text-soft)" }}>×</button>
        </div>

        <div className="scrl" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 22, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gridAutoRows: "max-content", alignContent: "start", gap: 16 }}>
          {works.map((s) => (
            <div key={s.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {s.imageUrl ? (
                <button onClick={() => setZoomed(s)} aria-label={`View ${s.title} full size`} style={{ display: "block", width: "100%", padding: 0, border: "none", background: "none", cursor: "zoom-in" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt={s.title} style={{ display: "block", width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }} />
                </button>
              ) : (
                <div style={{ aspectRatio: "1 / 1", background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>No image</div>
              )}
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 550 }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{[s.artist, s.medium].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {zoomed?.imageUrl && <ImageLightbox url={zoomed.imageUrl} alt={zoomed.title} onClose={() => setZoomed(null)} />}
    </>
  );
}
