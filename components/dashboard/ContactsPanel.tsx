"use client";

import { useState, useTransition } from "react";
import { avatarBg, initials } from "@/lib/utils";
import { inviteArtist } from "@/lib/supabase/actions";
import type { Contact } from "@/lib/types";

export default function ContactsPanel({ data }: { data: Contact[] }) {
  const [filter, setFilter] = useState<"All" | "Artist" | "Collector">("All");
  const filtered = filter === "All" ? data : data.filter(c => c.role === filter);
  const [inviteState, setInviteState] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [isPending, startTransition] = useTransition();

  function handleInvite(contact: Contact) {
    setInviteState(s => ({ ...s, [contact.email]: "sending" }));
    startTransition(async () => {
      try {
        await inviteArtist(contact.email, contact.name);
        setInviteState(s => ({ ...s, [contact.email]: "sent" }));
      } catch {
        setInviteState(s => ({ ...s, [contact.email]: "error" }));
      }
    });
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid var(--pl-border)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["All", "Artist", "Collector"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "var(--pl-solid)" : "var(--pl-border-strong)", background: filter === f ? "var(--pl-solid)" : "var(--pl-surface)", color: filter === f ? "var(--pl-on-solid)" : "var(--pl-text-muted)", cursor: "pointer" }}>
              {f}
            </button>
          ))}
        </div>
        <button style={{ fontSize: 13, padding: "8px 14px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Add contact</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 24px" }} className="scrl">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c, i) => (
            <div key={c.email} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarBg(i), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{initials(c.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 14, background: c.role === "Artist" ? "var(--pl-sidebar)" : "var(--pl-changes-bg)", color: c.role === "Artist" ? "var(--pl-text-muted)" : "var(--pl-changes-fg)", fontWeight: 600 }}>{c.role}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--pl-text-soft)", marginTop: 2 }}>{c.email}</div>
                <div style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)", marginTop: 2 }}>{c.focus}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "var(--pl-text-faint)" }}>Last contact</div>
                <div style={{ fontSize: 12.5, color: "var(--pl-text-muted)", marginTop: 1 }}>{c.last}</div>
              </div>
              {c.role === "Artist" && (
                <button
                  onClick={() => handleInvite(c)}
                  disabled={isPending && inviteState[c.email] === "sending"}
                  style={{
                    fontSize: 12,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--pl-border-strong)",
                    background: inviteState[c.email] === "sent" ? "var(--pl-changes-bg)" : "var(--pl-surface)",
                    color: inviteState[c.email] === "sent" ? "var(--pl-changes-fg)" : "var(--pl-text-muted)",
                    cursor: inviteState[c.email] === "sending" ? "default" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {inviteState[c.email] === "sending"
                    ? "Sending…"
                    : inviteState[c.email] === "sent"
                    ? "Invited"
                    : inviteState[c.email] === "error"
                    ? "Retry invite"
                    : "Invite to portal"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
