"use client";

import { useState, type CSSProperties } from "react";
import type { MarkPayoutPaidInput } from "@/lib/supabase/actions";
import type { Payout } from "@/lib/types";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

interface MarkPayoutPaidDrawerProps {
  payout: Payout;
  onClose: () => void;
  onConfirm: (input: MarkPayoutPaidInput) => void;
}

export default function MarkPayoutPaidDrawer({ payout, onClose, onConfirm }: MarkPayoutPaidDrawerProps) {
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState("");
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ready = paidDate.trim().length > 0 && !submitting;

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    try {
      await onConfirm({
        payoutId: payout.id,
        paidDate,
        paymentReference: paymentReference.trim() || null,
        proofOfPayment,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer scrl" style={{ width: "min(480px,94vw)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--pl-bg-app)", borderBottom: "1px solid var(--pl-border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)" }}>Payout · {payout.artist}</div>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: "3px 0 0", letterSpacing: "-.015em" }}>Mark {payout.amount} as paid</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text)", flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: "24px 24px 32px", display: "grid", gap: 18 }}>
          <div style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>For &ldquo;{payout.workTitle}&rdquo;, due {payout.dueDate}.</div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Paid on</span>
            <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Payment reference</span>
            <input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="e.g. bank transfer ref" style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Proof of payment (optional)</span>
            <input type="file" accept="image/*,application/pdf" onChange={e => setProofOfPayment(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: "var(--pl-text-secondary)" }} />
          </label>

          <div style={{ display: "flex", gap: 13, alignItems: "center", marginTop: 6 }}>
            <button
              onClick={submit}
              disabled={!ready}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", background: ready ? "var(--pl-solid)" : "var(--pl-border-strong)", color: ready ? "var(--pl-on-solid)" : "var(--pl-text-faint)" }}
            >
              {submitting ? "Saving…" : "Confirm payout"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
