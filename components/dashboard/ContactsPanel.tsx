"use client";

import { useState, useTransition } from "react";
import { avatarBg, initials } from "@/lib/utils";
import { inviteArtist, createContact, deleteContact } from "@/lib/supabase/actions";
import AddContactDrawer from "./AddContactDrawer";
import type { Contact } from "@/lib/types";

export default function ContactsPanel({ data }: { data: Contact[] }) {
  const [contacts, setContacts] = useState(data);
  const [filter, setFilter] = useState<"All" | "Artist" | "Collector">("All");
  const filtered = filter === "All" ? contacts : contacts.filter(c => c.role === filter);
  const [inviteState, setInviteState] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [removeState, setRemoveState] = useState<Record<string, "confirm" | "removing" | "error">>({});

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

  function handleCreate(contact: Pick<Contact, "name" | "email" | "role" | "focus">, sendInvite: boolean) {
    const tempId = crypto.randomUUID();
    setContacts(prev => [{ ...contact, id: tempId, last: "Just now" }, ...prev]);
    setAddOpen(false);
    setToast(sendInvite ? `Portal invitation sent to ${contact.name}` : `${contact.name} added to contacts`);
    setTimeout(() => setToast(null), 3800);
    startTransition(async () => {
      try {
        const { id, inviteError } = await createContact({ ...contact, sendInvite });
        setContacts(prev => prev.map(c => (c.id === tempId ? { ...c, id } : c)));
        if (sendInvite) {
          setInviteState(s => ({ ...s, [contact.email]: inviteError ? "error" : "sent" }));
          if (inviteError) {
            setToast(`${contact.name} added, but the invite couldn't be sent`);
            setTimeout(() => setToast(null), 3800);
          }
        }
      } catch (err) {
        setContacts(prev => prev.filter(c => c.id !== tempId));
        setToast(err instanceof Error ? err.message : `Couldn't add ${contact.name} — try again`);
        setTimeout(() => setToast(null), 3800);
      }
    });
  }

  function handleRemoveClick(contact: Contact) {
    if (removeState[contact.id] !== "confirm") {
      setRemoveState(s => ({ ...s, [contact.id]: "confirm" }));
      return;
    }
    setRemoveState(s => ({ ...s, [contact.id]: "removing" }));
    startTransition(async () => {
      try {
        await deleteContact(contact.id);
        setContacts(cs => cs.filter(c => c.id !== contact.id));
      } catch {
        setRemoveState(s => ({ ...s, [contact.id]: "error" }));
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
        <button onClick={() => setAddOpen(true)} style={{ fontSize: 13, padding: "8px 14px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Add contact</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 24px" }} className="scrl">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c, i) => (
            <div key={c.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13 }}>
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
              <button
                onClick={() => handleRemoveClick(c)}
                disabled={isPending && removeState[c.id] === "removing"}
                style={{
                  fontSize: 12,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--pl-border-strong)",
                  background: removeState[c.id] === "confirm" ? "#c0392b" : "var(--pl-surface)",
                  color: removeState[c.id] === "confirm" ? "#fff" : "var(--pl-text-muted)",
                  cursor: removeState[c.id] === "removing" ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                {removeState[c.id] === "removing"
                  ? "Removing…"
                  : removeState[c.id] === "confirm"
                  ? "Confirm?"
                  : removeState[c.id] === "error"
                  ? "Retry remove"
                  : "Remove"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {addOpen && (
        <AddContactDrawer
          onClose={() => setAddOpen(false)}
          onCreate={handleCreate}
          existingEmails={contacts.map(c => c.email.toLowerCase())}
        />
      )}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
