"use client";

import { useState } from "react";
import { EX_STATUS_META, EX_TYPE_META } from "@/lib/constants";
import type { Contact, Exhibition, ExhibitionInvite } from "@/lib/types";
import type { ExhibitionInput } from "@/lib/supabase/actions";
import ExhibitionFormFields, { type ExhibitionFormState } from "./ExhibitionFormFields";

function toForm(ex: Exhibition): ExhibitionFormState {
  return {
    title: ex.title,
    type: ex.type,
    blurb: ex.blurb,
    theme: ex.theme,
    mediumRequirements: ex.mediumRequirements,
    sizeRequirements: ex.sizeRequirements,
    rules: ex.rules,
    slots: String(ex.slots),
    submissionDeadline: ex.submissionDeadline ?? "",
    openingDate: ex.openingDate ?? "",
    closingDate: ex.closingDate ?? "",
    deliveryDate: ex.deliveryDate ?? "",
  };
}

const inviteStatusMeta: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending", bg: "var(--pl-pending-bg)", fg: "var(--pl-pending-fg)" },
  accepted: { label: "Accepted", bg: "var(--pl-approved-bg)", fg: "var(--pl-approved-fg)" },
  declined: { label: "Declined", bg: "var(--pl-declined-bg)", fg: "var(--pl-declined-fg)" },
  revoked: { label: "Revoked", bg: "var(--pl-neutral-chip-bg)", fg: "var(--pl-neutral-chip-fg)" },
  expired: { label: "Expired", bg: "var(--pl-neutral-chip-bg)", fg: "var(--pl-neutral-chip-fg)" },
};

interface ExhibitionDetailDrawerProps {
  ex: Exhibition;
  invites: ExhibitionInvite[];
  artistContacts: Contact[];
  onClose: () => void;
  onUpdate: (id: string, input: Partial<ExhibitionInput>) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onInvite: (exhibitionId: string, artist: { existingArtistId?: string; email: string; fullName?: string }, message?: string) => void;
  onRevokeInvite: (id: string) => void;
}

export default function ExhibitionDetailDrawer({
  ex, invites, artistContacts, onClose, onUpdate, onArchive, onUnarchive, onDelete, onInvite, onRevokeInvite,
}: ExhibitionDetailDrawerProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<ExhibitionFormState>(() => toForm(ex));
  const [removeState, setRemoveState] = useState<"idle" | "confirm">("idle");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteExistingId, setInviteExistingId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const meta = EX_STATUS_META[ex.status];
  const isArchived = ex.status === "archived";

  function saveEdit() {
    if (!form.title.trim()) return;
    onUpdate(ex.id, {
      title: form.title.trim(),
      type: form.type,
      blurb: form.blurb.trim(),
      theme: form.theme.trim(),
      mediumRequirements: form.mediumRequirements.trim(),
      sizeRequirements: form.sizeRequirements.trim(),
      rules: form.rules.trim(),
      slots: Number(form.slots) || 0,
      submissionDeadline: form.submissionDeadline || null,
      openingDate: form.openingDate || null,
      closingDate: form.closingDate || null,
      deliveryDate: form.deliveryDate || null,
    });
    setMode("view");
  }

  function submitInvite() {
    const email = inviteExistingId
      ? artistContacts.find((c) => c.id === inviteExistingId)?.email ?? ""
      : inviteEmail.trim();
    const fullName = inviteExistingId
      ? artistContacts.find((c) => c.id === inviteExistingId)?.name ?? ""
      : inviteName.trim();
    if (!email) return;
    onInvite(ex.id, { existingArtistId: undefined, email, fullName }, inviteMessage.trim() || undefined);
    setInviteEmail("");
    setInviteName("");
    setInviteExistingId("");
    setInviteMessage("");
  }

  function handleDeleteClick() {
    if (removeState !== "confirm") {
      setRemoveState("confirm");
      return;
    }
    onDelete(ex.id);
  }

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer scrl" style={{ width: "min(620px,100%)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--pl-border)", position: "sticky", top: 0, background: "var(--pl-bg-app)", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{meta.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>{EX_TYPE_META[ex.type]}</span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text-soft)" }}>×</button>
        </div>

        <div style={{ padding: "22px 24px 0" }}>
          {mode === "view" ? (
            <>
              <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 26, fontWeight: 550, margin: 0, letterSpacing: "-.015em" }}>{ex.title}</h2>
              <div style={{ fontSize: 13, color: "var(--pl-text-soft)", marginTop: 6 }}>{ex.dates}</div>
              {ex.blurb && <p style={{ fontSize: 13.5, color: "var(--pl-text-muted)", marginTop: 10 }}>{ex.blurb}</p>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px", marginTop: 20 }}>
                {[
                  ["Slots", `${ex.filled}/${ex.slots} filled`],
                  ["Applicants", ex.applicants],
                  ["Theme", ex.theme || "—"],
                  ["Medium requirements", ex.mediumRequirements || "—"],
                  ["Size requirements", ex.sizeRequirements || "—"],
                  ["Submission deadline", ex.submissionDeadline ?? "—"],
                  ["Delivery date", ex.deliveryDate ?? "—"],
                  ["Opening date", ex.openingDate ?? "—"],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>{k}</div>
                    <div style={{ fontSize: 13.5, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>

              {ex.rules && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)", marginBottom: 6 }}>Rules for entering</div>
                  <p style={{ fontSize: 13.5, color: "var(--pl-text-secondary)", lineHeight: 1.65, margin: 0 }}>{ex.rules}</p>
                </div>
              )}

              <button onClick={() => { setForm(toForm(ex)); setMode("edit"); }} style={{ marginTop: 22, padding: "11px 18px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>
                Edit exhibition
              </button>
            </>
          ) : (
            <>
              <ExhibitionFormFields form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={saveEdit} style={{ padding: "11px 18px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>Save changes</button>
                <button onClick={() => setMode("view")} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
              </div>
            </>
          )}
        </div>

        {mode === "view" && (
          <>
            <div style={{ margin: "26px 24px 0", borderTop: "1px solid var(--pl-border)", paddingTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Invite an artist</div>
              <div style={{ display: "grid", gap: 10 }}>
                <select
                  value={inviteExistingId}
                  onChange={(e) => { setInviteExistingId(e.target.value); setInviteEmail(""); setInviteName(""); }}
                  style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--pl-text)" }}
                >
                  <option value="">— Invite by email instead —</option>
                  {artistContacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                {!inviteExistingId && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Name" style={{ flex: 1, background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--pl-text)" }} />
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@studio.co.za" type="email" style={{ flex: 1, background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--pl-text)" }} />
                  </div>
                )}
                <input value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} placeholder="Personal note (optional)" style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--pl-text)" }} />
                <button
                  onClick={submitInvite}
                  disabled={!inviteExistingId && !inviteEmail.trim()}
                  style={{ padding: "10px 16px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 550, cursor: "pointer", alignSelf: "flex-start" }}
                >
                  Send invite
                </button>
              </div>

              {invites.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {invites.map((inv) => {
                    const im = inviteStatusMeta[inv.status];
                    return (
                      <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 10, padding: "10px 13px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 550 }}>{inv.fullName || inv.email}</div>
                          <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)" }}>{inv.email}</div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: im.bg, color: im.fg }}>{im.label}</span>
                        {inv.status === "pending" && (
                          <button onClick={() => onRevokeInvite(inv.id)} style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 7, border: "1px solid var(--pl-border-strong)", background: "var(--pl-surface)", color: "var(--pl-text-muted)", cursor: "pointer" }}>
                            Revoke
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ margin: "26px 24px 28px", borderTop: "1px solid var(--pl-border)", paddingTop: 20, display: "flex", gap: 10 }}>
              {isArchived ? (
                <button onClick={() => onUnarchive(ex.id)} style={{ padding: "10px 16px", background: "var(--pl-surface)", border: "1px solid var(--pl-border-strong)", borderRadius: 9, fontSize: 13, color: "var(--pl-text-muted)", cursor: "pointer" }}>
                  Restore from archive
                </button>
              ) : (
                <button onClick={() => onArchive(ex.id)} style={{ padding: "10px 16px", background: "var(--pl-surface)", border: "1px solid var(--pl-border-strong)", borderRadius: 9, fontSize: 13, color: "var(--pl-text-muted)", cursor: "pointer" }}>
                  Archive
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                disabled={ex.applicants > 0}
                title={ex.applicants > 0 ? "Exhibitions with submissions can't be deleted — archive instead." : undefined}
                style={{
                  padding: "10px 16px", borderRadius: 9, fontSize: 13, border: "1px solid var(--pl-border-strong)",
                  background: removeState === "confirm" ? "#c0392b" : "var(--pl-surface)",
                  color: removeState === "confirm" ? "#fff" : ex.applicants > 0 ? "var(--pl-text-faint)" : "var(--pl-declined-fg)",
                  cursor: ex.applicants > 0 ? "not-allowed" : "pointer",
                }}
              >
                {removeState === "confirm" ? "Confirm delete?" : "Delete exhibition"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
