"use client";

import { useState } from "react";
import { STATUS_META } from "@/lib/constants";
import { artworkBg, avatarBg, initials } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/lib/types";

interface ReviewDrawerProps {
  sub: Submission;
  artworkIdx: number;
  onClose: () => void;
  onDecide: (id: string, status: SubmissionStatus, note: string) => void;
}

export default function ReviewDrawer({ sub, artworkIdx, onClose, onDecide }: ReviewDrawerProps) {
  const [note, setNote] = useState(sub.note);
  const [mode, setMode] = useState<"view" | "decide">("view");
  const meta = STATUS_META[sub.status];

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer" style={{ width: "min(560px,100%)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--pl-border)", position: "sticky", top: 0, background: "var(--pl-bg-app)", zIndex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{meta.label}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text-soft)" }}>×</button>
        </div>

        {/* Artwork */}
        <div style={{ height: 220, background: artworkBg(artworkIdx), flexShrink: 0 }} />

        {/* Info */}
        <div style={{ padding: "22px 24px 0" }}>
          <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 26, fontWeight: 550, margin: 0, letterSpacing: "-.015em" }}>{sub.title}</h2>
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: avatarBg(artworkIdx), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 600, flexShrink: 0 }}>{initials(sub.artist)}</div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{sub.artist}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px", marginTop: 20 }}>
            {[
              ["Year", sub.year],
              ["Medium", sub.medium],
              ["Dimensions", sub.dim],
              ["Price (excl. comm.)", sub.price],
              ["Exhibition", sub.forEx],
              ["Submitted", sub.date],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>{k}</div>
                <div style={{ fontSize: 13.5, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)", marginBottom: 6 }}>Artist statement</div>
            <p style={{ fontSize: 13.5, color: "var(--pl-text-secondary)", lineHeight: 1.65, margin: 0 }}>{sub.statement}</p>
          </div>

          {sub.note && (
            <div style={{ marginTop: 18, background: "var(--pl-sidebar)", borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)", marginBottom: 5 }}>Gallery note</div>
              <p style={{ fontSize: 13, color: "var(--pl-text-secondary)", lineHeight: 1.6, margin: 0 }}>{sub.note}</p>
            </div>
          )}
        </div>

        {/* Decision */}
        {sub.status === "pending" && (
          <div style={{ padding: 24, marginTop: "auto" }}>
            {mode === "view" ? (
              <button onClick={() => setMode("decide")} style={{ width: "100%", padding: "13px", background: "var(--pl-text)", color: "var(--pl-on-dark)", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 550, cursor: "pointer" }}>
                Make a decision
              </button>
            ) : (
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)", marginBottom: 8 }}>Note to artist (required for decline / changes)</div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Write a kind, honest response…"
                  style={{ width: "100%", background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 10, padding: "11px 13px", fontSize: 13.5, resize: "none", fontFamily: "inherit", color: "var(--pl-text)" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <button onClick={() => onDecide(sub.id, "approved", note)} style={{ padding: "12px", background: "var(--pl-approved-panel-bg)", color: "var(--pl-approved-fg)", border: "1px solid var(--pl-approved-panel-border)", borderRadius: 10, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>Approve</button>
                  <button onClick={() => onDecide(sub.id, "changes", note)} style={{ padding: "12px", background: "var(--pl-changes-panel-bg)", color: "var(--pl-changes-fg)", border: "1px solid var(--pl-changes-panel-border)", borderRadius: 10, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>Request changes</button>
                  <button onClick={() => onDecide(sub.id, "declined", note)} style={{ padding: "12px", background: "var(--pl-declined-panel-bg)", color: "var(--pl-declined-fg)", border: "1px solid var(--pl-declined-panel-border)", borderRadius: 10, fontSize: 13.5, fontWeight: 550, cursor: "pointer", gridColumn: "1/-1" }}>Decline</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ack warning */}
        {sub.status === "declined" && sub.ack === false && (
          <div style={{ margin: "18px 24px 24px", background: "var(--pl-declined-panel-bg)", border: "1px solid var(--pl-declined-panel-border)", borderRadius: 11, padding: "13px 15px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, lineHeight: 1.2 }}>⏳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pl-declined-fg)" }}>Awaiting acknowledgement</div>
              <div style={{ fontSize: 12, color: "var(--pl-declined-fg)", marginTop: 3, lineHeight: 1.5 }}>The artist hasn&apos;t confirmed this decision yet. They&apos;ll see a blocking notice on next login.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
