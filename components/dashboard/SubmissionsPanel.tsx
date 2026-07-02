"use client";

import { useState } from "react";
import ReviewDrawer from "./ReviewDrawer";
import { SUBMISSIONS } from "@/lib/data";
import { STATUS_META } from "@/lib/constants";
import { artworkBg } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/lib/types";

export default function SubmissionsPanel() {
  const [submissions, setSubmissions] = useState(SUBMISSIONS);
  const [filter, setFilter] = useState<"all" | SubmissionStatus>("all");
  const [active, setActive] = useState<Submission | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);

  const counts: Record<string, number> = { all: submissions.length };
  for (const s of submissions) counts[s.status] = (counts[s.status] ?? 0) + 1;

  function decide(id: string, status: SubmissionStatus, note: string) {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status, note, ack: status === "declined" ? false : undefined } : s));
    setActive(null);
    setToast(
      status === "approved" ? "Work approved — drop-off pass issued." :
      status === "declined" ? "Work declined — artist will be notified." :
      "Changes requested — artist notified."
    );
    setTimeout(() => setToast(null), 3800);
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* Filter strip */}
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid var(--pl-border)", flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "declined", "changes"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "var(--pl-text)" : "var(--pl-border-strong)", background: filter === f ? "var(--pl-text)" : "var(--pl-surface)", color: filter === f ? "var(--pl-on-dark)" : "var(--pl-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            {f === "all" ? "All" : STATUS_META[f].label}
            {counts[f] ? <span style={{ fontSize: 10, background: filter === f ? "rgba(255,255,255,.2)" : "var(--pl-sidebar)", color: filter === f ? "var(--pl-on-dark)" : "var(--pl-text-soft)", padding: "1px 5px", borderRadius: 10 }}>{counts[f]}</span> : null}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18 }} className="scrl">
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--pl-text-eyebrow)", fontSize: 14 }}>No submissions in this filter.</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {filtered.map((s, i) => {
            const meta = STATUS_META[s.status];
            return (
              <button key={s.id} onClick={() => { setActive(s); setActiveIdx(i); }} style={{ textAlign: "left", background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", padding: 0 }}>
                <div style={{ height: 110, background: artworkBg(i) }} />
                <div style={{ padding: "11px 13px 13px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{s.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{s.artist}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 14, background: meta.bg, color: meta.fg, whiteSpace: "nowrap", flexShrink: 0, marginTop: 1 }}>{meta.label}</span>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--pl-text-eyebrow)" }}>{s.medium}</span>
                    <span style={{ fontSize: 11, color: "var(--pl-text-faint)" }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--pl-text-eyebrow)" }}>{s.dim}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 500, color: "var(--pl-text-secondary)" }}>{s.price}</div>
                  {s.status === "declined" && s.ack === false && (
                    <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--pl-declined-fg)", background: "var(--pl-declined-panel-bg)", padding: "4px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span>⏳</span> Awaiting acknowledgement
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <ReviewDrawer
          sub={active}
          artworkIdx={activeIdx}
          onClose={() => setActive(null)}
          onDecide={decide}
        />
      )}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-text)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
