"use client";

import { useState } from "react";
import { getConsignmentTermsSignedUrl } from "@/lib/supabase/actions";

// Read-only display of consignment terms: the typed text, or a button that
// opens the PDF through a short-lived signed URL (the bucket is private).
export default function ConsignmentTermsView({ text, pdfPath, maxHeight = 220 }: { text?: string; pdfPath?: string | null; maxHeight?: number }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);

  async function openPdf() {
    if (!pdfPath) return;
    setOpening(true);
    setError(false);
    // Opened before the await so the popup isn't blocked.
    const win = window.open("", "_blank");
    try {
      const url = await getConsignmentTermsSignedUrl(pdfPath);
      if (!url) throw new Error("no url");
      if (win) win.location.href = url;
      else window.open(url, "_blank");
    } catch {
      win?.close();
      setError(true);
    } finally {
      setOpening(false);
    }
  }

  if (pdfPath) {
    return (
      <div>
        <button
          type="button"
          onClick={openPdf}
          disabled={opening}
          style={{ fontSize: 13, padding: "8px 14px", border: "1px solid var(--pl-border-strong)", borderRadius: 8, background: "none", color: "var(--pl-text-secondary)", cursor: opening ? "wait" : "pointer", fontFamily: "inherit" }}
        >
          {opening ? "Opening…" : "Open consignment terms (PDF)"}
        </button>
        {error && <div style={{ fontSize: 12, color: "var(--pl-declined-fg)", marginTop: 6 }}>Couldn&apos;t open the PDF. Try again.</div>}
      </div>
    );
  }
  if (!text) return null;
  return (
    <div className="scrl" style={{ maxHeight, overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, color: "var(--pl-text-secondary)", background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px" }}>
      {text}
    </div>
  );
}
