"use client";

import { useState } from "react";
import { PAYOUT_STATUS_META, OVERDUE_META } from "@/lib/constants";
import { markPayoutPaid, type MarkPayoutPaidInput } from "@/lib/supabase/actions";
import MarkPayoutPaidDrawer from "./MarkPayoutPaidDrawer";
import type { Payout } from "@/lib/types";

type Filter = "all" | "due" | "overdue" | "awaiting-ack";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "due", label: "Due" },
  { id: "overdue", label: "Overdue" },
  { id: "awaiting-ack", label: "Awaiting acknowledgement" },
];

function isOverdue(p: Payout): boolean {
  return p.status === "due" && p.dueDateRaw !== null && p.dueDateRaw < new Date().toISOString().slice(0, 10);
}

export default function PayoutsPanel({ data }: { data: Payout[] }) {
  const [payouts, setPayouts] = useState(data);
  const [filter, setFilter] = useState<Filter>("all");
  const [paying, setPaying] = useState<Payout | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3800);
  }

  const filtered = payouts.filter(p => {
    if (filter === "all") return true;
    if (filter === "due") return p.status === "due" && !isOverdue(p);
    if (filter === "overdue") return isOverdue(p);
    if (filter === "awaiting-ack") return p.status === "paid";
    return true;
  });

  async function handleMarkPaid(input: MarkPayoutPaidInput) {
    const payout = paying;
    if (!payout) return;
    try {
      const { noticeError } = await markPayoutPaid(input);
      setPayouts(prev => prev.map(p => p.id === payout.id ? {
        ...p,
        status: "paid",
        paidDate: new Date(input.paidDate).toLocaleDateString(),
        paidDateRaw: input.paidDate,
        paymentReference: input.paymentReference,
        hasProofOfPayment: p.hasProofOfPayment || input.proofOfPayment != null,
      } : p));
      setPaying(null);
      notify(noticeError ? `Marked as paid, but ${payout.artist} wasn't notified: ${noticeError}` : `Marked ${payout.amount} to ${payout.artist} as paid.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't record that payout — try again.");
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid var(--pl-border)", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f.id ? "var(--pl-solid)" : "var(--pl-border-strong)", background: filter === f.id ? "var(--pl-solid)" : "var(--pl-surface)", color: filter === f.id ? "var(--pl-on-solid)" : "var(--pl-text-muted)", cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--pl-border)" }}>
              {["Work", "Artist", "Amount", "Due", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)", padding: "0 12px 10px", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const overdue = isOverdue(p);
              const meta = overdue ? OVERDUE_META : PAYOUT_STATUS_META[p.status];
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--pl-divider)" }}>
                  <td style={{ padding: "13px 12px", fontFamily: "var(--font-newsreader, serif)", fontSize: 14.5, fontWeight: 600 }}>{p.workTitle}</td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, color: "var(--pl-text-secondary)" }}>{p.artist}</td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, fontWeight: 500 }}>{p.amount}</td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, color: "var(--pl-text-secondary)" }}>{p.dueDate}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{overdue ? OVERDUE_META.label : PAYOUT_STATUS_META[p.status].label}</span>
                  </td>
                  <td style={{ padding: "13px 12px", textAlign: "right" }}>
                    {p.status === "due" && (
                      <button onClick={() => setPaying(p)} style={{ fontSize: 12.5, padding: "7px 13px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>
                        Mark as paid
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "var(--pl-text-eyebrow)", fontSize: 14 }}>No payouts in this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {paying && <MarkPayoutPaidDrawer payout={paying} onClose={() => setPaying(null)} onConfirm={handleMarkPaid} />}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
