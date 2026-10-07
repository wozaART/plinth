"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { TERMS_QUESTIONS } from "@/lib/consignment-terms";
import {
  markConsignmentResponseReviewed,
  sendConsignmentTermsFollowup,
  sendConsignmentTermsInvite,
} from "@/lib/supabase/consignment-terms-actions";
import type { ConsignmentTermsResponse } from "@/lib/supabase/queries";

const LABELS = Object.fromEntries(TERMS_QUESTIONS.map((q) => [q.id, q.label]));

const CARD: CSSProperties = {
  background: "var(--pl-surface)",
  border: "1px solid var(--pl-border)",
  borderRadius: "var(--pl-radius-card-lg)",
  padding: "20px 22px",
};

const BUTTON: CSSProperties = {
  background: "var(--pl-solid)",
  color: "var(--pl-on-solid)",
  border: "none",
  borderRadius: 9,
  padding: "9px 16px",
  fontFamily: "inherit",
  fontSize: 13.5,
  fontWeight: 500,
  cursor: "pointer",
};

const INPUT: CSSProperties = {
  width: "100%",
  border: "1px solid var(--pl-border-input)",
  borderRadius: "var(--pl-radius-input)",
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 14,
  color: "var(--pl-text)",
  background: "var(--pl-surface)",
  boxSizing: "border-box",
};

function InviteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit() {
    setMessage(null);
    startTransition(async () => {
      try {
        await sendConsignmentTermsInvite({ contactName: name, contactEmail: email });
        setMessage("Invite sent.");
        setName("");
        setEmail("");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Couldn't send the invite.");
      }
    });
  }

  return (
    <div style={CARD}>
      <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 19, fontWeight: 500, margin: 0 }}>Invite a gallery</h2>
      <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: "6px 0 16px" }}>
        Emails the consignment terms form link to a prospective gallery contact.
      </p>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", maxWidth: 560 }}>
        <input style={INPUT} placeholder="Contact name" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={INPUT} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{ ...BUTTON, opacity: pending ? 0.6 : 1 }} disabled={pending || !name || !email} onClick={submit}>
          {pending ? "Sending…" : "Send invite"}
        </button>
        {message && <span style={{ fontSize: 13, color: "var(--pl-text-muted)" }}>{message}</span>}
      </div>
    </div>
  );
}

function ResponseRow({ r }: { r: ConsignmentTermsResponse }) {
  const [open, setOpen] = useState(false);
  const [followup, setFollowup] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState(r.status);

  function markReviewed() {
    startTransition(async () => {
      await markConsignmentResponseReviewed(r.id);
      setStatus("reviewed");
    });
  }

  function sendFollowup() {
    if (!followup.trim()) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await sendConsignmentTermsFollowup(r.id, followup.trim());
        setFollowup("");
        setMessage("Follow-up sent.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Couldn't send the follow-up.");
      }
    });
  }

  return (
    <div style={CARD}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 17, fontWeight: 500 }}>{r.galleryName}</div>
          <div style={{ fontSize: 13, color: "var(--pl-text-muted)", marginTop: 2 }}>
            {r.contactName}
            {r.contactRole ? ` · ${r.contactRole}` : ""}
            {r.contactEmail ? ` · ${r.contactEmail}` : ""}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 14,
            whiteSpace: "nowrap",
            background: status === "reviewed" ? "var(--pl-approved-panel-bg)" : "var(--pl-sidebar)",
            color: status === "reviewed" ? "var(--pl-approved-fg)" : "var(--pl-text-soft)",
          }}
        >
          {status === "reviewed" ? "Reviewed" : "New"}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            {Object.entries(r.answers)
              .filter(([, v]) => v)
              .map(([id, value]) => (
                <div key={id} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, fontSize: 13 }}>
                  <span style={{ color: "var(--pl-text-soft)" }}>{LABELS[id] || id}</span>
                  <span>{value}</span>
                </div>
              ))}
          </div>

          {r.followups.length > 0 && (
            <div style={{ borderTop: "1px solid var(--pl-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {r.followups.map((f) => (
                <div key={f.id} style={{ fontSize: 13, color: "var(--pl-text-body)" }}>
                  <span style={{ color: "var(--pl-text-soft)" }}>{new Date(f.createdAt).toLocaleDateString()}: </span>
                  {f.message}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              placeholder="Ask a follow-up question…"
              rows={2}
              style={{ ...INPUT, resize: "vertical" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={{ ...BUTTON, opacity: pending || !followup.trim() ? 0.6 : 1 }} disabled={pending || !followup.trim()} onClick={sendFollowup}>
                Send follow-up
              </button>
              {status !== "reviewed" && (
                <button
                  onClick={markReviewed}
                  disabled={pending}
                  style={{ background: "none", border: "1px solid var(--pl-border-strong)", borderRadius: 9, padding: "9px 16px", fontSize: 13.5, color: "var(--pl-text-muted)", cursor: "pointer" }}
                >
                  Mark reviewed
                </button>
              )}
              {message && <span style={{ fontSize: 13, color: "var(--pl-text-muted)" }}>{message}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConsignmentTermsAdmin({ initialResponses }: { initialResponses: ConsignmentTermsResponse[] }) {
  return (
    <main style={{ flex: 1, background: "var(--pl-bg-app)", color: "var(--pl-text)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 16px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 28, fontWeight: 500, margin: 0 }}>Consignment terms inquiries</h1>

        <InviteForm />

        {initialResponses.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--pl-text-muted)" }}>No responses yet.</p>
        ) : (
          initialResponses.map((r) => <ResponseRow key={r.id} r={r} />)
        )}
      </div>
    </main>
  );
}
