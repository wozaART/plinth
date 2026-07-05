"use client";

import { useState, type CSSProperties } from "react";
import type { Contact } from "@/lib/types";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

interface AddContactDrawerProps {
  onClose: () => void;
  onCreate: (contact: Pick<Contact, "name" | "email" | "role" | "focus">, sendInvite: boolean) => void;
  existingEmails: string[];
}

export default function AddContactDrawer({ onClose, onCreate, existingEmails }: AddContactDrawerProps) {
  const [role, setRole] = useState<Contact["role"]>("Artist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [focus, setFocus] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  const isArtist = role === "Artist";
  const isDuplicate = existingEmails.includes(email.trim().toLowerCase());
  const ready = name.trim().length > 0 && email.trim().length > 0 && !isDuplicate;
  const willInvite = isArtist && sendInvite;

  function submit() {
    if (!ready) return;
    onCreate({ name: name.trim(), email: email.trim(), role, focus: focus.trim() }, willInvite);
  }

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer scrl" style={{ width: "min(520px,94vw)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--pl-bg-app)", borderBottom: "1px solid var(--pl-border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)" }}>Directory</div>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: "3px 0 0", letterSpacing: "-.015em" }}>Add contact</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text)", flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: "24px 24px 32px", display: "grid", gap: 18 }}>
          <div>
            <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>Type</label>
            <div style={{ display: "flex", gap: 9 }}>
              {(["Artist", "Collector"] as const).map(r => (
                <button key={r} onClick={() => setRole(r)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 550, cursor: "pointer", border: "1px solid", borderColor: role === r ? "var(--pl-solid)" : "var(--pl-border-strong)", background: role === r ? "var(--pl-solid)" : "var(--pl-surface)", color: role === r ? "var(--pl-on-solid)" : "var(--pl-text-muted)" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Full name <span style={{ color: "var(--pl-declined-fg)", textTransform: "none", letterSpacing: 0 }}>required</span></span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nomvula Zulu" style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Email <span style={{ color: "var(--pl-declined-fg)", textTransform: "none", letterSpacing: 0 }}>required</span></span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@studio.co.za" style={inputStyle} />
            {isDuplicate && <span style={{ fontSize: 12, color: "var(--pl-declined-fg)" }}>A contact with this email already exists.</span>}
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Focus <span style={{ color: "var(--pl-text-faint)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>optional</span></span>
            <input value={focus} onChange={e => setFocus(e.target.value)} placeholder={isArtist ? "e.g. Landscape painting, Ceramics" : "e.g. Contemporary SA, Sculpture"} style={inputStyle} />
          </label>

          {isArtist && (
            <div className="anim-pop" style={{ borderTop: "1px solid var(--pl-border)", paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Send artist portal invitation</div>
                  <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 3, lineHeight: 1.5 }}>Emails an invite to join your artist portal, where they can manage listings, track consignments, and collaborate with the gallery.</div>
                </div>
                <button
                  onClick={() => setSendInvite(v => !v)}
                  style={{ width: 44, height: 25, borderRadius: 20, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, background: sendInvite ? "var(--pl-solid)" : "var(--pl-border-strong)", transition: "background .15s" }}
                >
                  <span style={{ position: "absolute", top: 3, left: sendInvite ? 22 : 3, width: 19, height: 19, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 13, alignItems: "center", marginTop: 6 }}>
            <button
              onClick={submit}
              disabled={!ready}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", background: ready ? "var(--pl-solid)" : "var(--pl-border-strong)", color: ready ? "var(--pl-on-solid)" : "var(--pl-text-faint)" }}
            >
              {willInvite ? "Add & send invitation" : "Add contact"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
