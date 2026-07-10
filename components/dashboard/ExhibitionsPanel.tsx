"use client";

import { useState, useTransition } from "react";
import { EX_STATUS_META } from "@/lib/constants";
import {
  createExhibition,
  updateExhibition,
  archiveExhibition,
  unarchiveExhibition,
  deleteExhibition,
  inviteArtistToExhibition,
  revokeExhibitionInvite,
  type ExhibitionInput,
} from "@/lib/supabase/actions";
import type { Contact, Exhibition, ExhibitionInvite } from "@/lib/types";
import CreateExhibitionDrawer from "./CreateExhibitionDrawer";
import ExhibitionDetailDrawer from "./ExhibitionDetailDrawer";

interface ExhibitionsPanelProps {
  data: Exhibition[];
  invites: ExhibitionInvite[];
  contacts: Contact[];
}

export default function ExhibitionsPanel({ data, invites: initialInvites, contacts }: ExhibitionsPanelProps) {
  const [exhibitions, setExhibitions] = useState(data);
  const [invites, setInvites] = useState(initialInvites);
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const artistContacts = contacts.filter((c) => c.role === "Artist");
  const visible = exhibitions.filter((ex) => showArchived || ex.status !== "archived");
  const openEx = exhibitions.find((ex) => ex.id === openId) ?? null;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleCreate(input: ExhibitionInput) {
    const tempId = crypto.randomUUID();
    setExhibitions((prev) => [
      ...prev,
      {
        id: tempId,
        title: input.title,
        type: input.type,
        status: "planning",
        blurb: input.blurb,
        theme: input.theme,
        mediumRequirements: input.mediumRequirements,
        sizeRequirements: input.sizeRequirements,
        rules: input.rules,
        slots: input.slots,
        filled: 0,
        applicants: 0,
        submissionDeadline: input.submissionDeadline,
        openingDate: input.openingDate,
        closingDate: input.closingDate,
        deliveryDate: input.deliveryDate,
        dates: input.openingDate && input.closingDate ? `${input.openingDate} – ${input.closingDate}` : "Dates to be confirmed",
      },
    ]);
    setCreateOpen(false);
    startTransition(async () => {
      try {
        const { id } = await createExhibition(input);
        setExhibitions((prev) => prev.map((ex) => (ex.id === tempId ? { ...ex, id } : ex)));
      } catch (err) {
        setExhibitions((prev) => prev.filter((ex) => ex.id !== tempId));
        flash(err instanceof Error ? err.message : "Couldn't create exhibition — try again");
      }
    });
  }

  function handleUpdate(id: string, input: Partial<ExhibitionInput>) {
    setExhibitions((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...(input as Partial<Exhibition>) } : ex)));
    startTransition(async () => {
      try {
        await updateExhibition(id, input);
      } catch (err) {
        flash(err instanceof Error ? err.message : "Couldn't save changes — try again");
      }
    });
  }

  function handleArchive(id: string) {
    setExhibitions((prev) => prev.map((ex) => (ex.id === id ? { ...ex, status: "archived" } : ex)));
    startTransition(async () => {
      try {
        await archiveExhibition(id);
      } catch (err) {
        flash(err instanceof Error ? err.message : "Couldn't archive exhibition");
      }
    });
  }

  function handleUnarchive(id: string) {
    setExhibitions((prev) => prev.map((ex) => (ex.id === id ? { ...ex, status: "planning" } : ex)));
    startTransition(async () => {
      try {
        await unarchiveExhibition(id);
      } catch (err) {
        flash(err instanceof Error ? err.message : "Couldn't restore exhibition");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteExhibition(id);
        setExhibitions((prev) => prev.filter((ex) => ex.id !== id));
        setOpenId(null);
      } catch (err) {
        flash(err instanceof Error ? err.message : "Couldn't delete exhibition");
      }
    });
  }

  function handleInvite(exhibitionId: string, artist: { existingArtistId?: string; email: string; fullName?: string }, message?: string) {
    startTransition(async () => {
      try {
        await inviteArtistToExhibition(exhibitionId, artist, message);
        setInvites((prev) => [
          {
            id: crypto.randomUUID(),
            exhibitionId,
            exhibitionTitle: exhibitions.find((ex) => ex.id === exhibitionId)?.title ?? "",
            artistId: artist.existingArtistId ?? null,
            email: artist.email,
            fullName: artist.fullName ?? "",
            message: message ?? "",
            status: "pending",
            createdAt: new Date().toISOString(),
            expiresAt: "",
            respondedAt: null,
          },
          ...prev,
        ]);
        flash(`Invitation sent to ${artist.fullName || artist.email}`);
      } catch (err) {
        flash(err instanceof Error ? err.message : "Couldn't send invitation");
      }
    });
  }

  function handleRevokeInvite(id: string) {
    setInvites((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "revoked" } : inv)));
    startTransition(async () => {
      try {
        await revokeExhibitionInvite(id);
      } catch (err) {
        flash(err instanceof Error ? err.message : "Couldn't revoke invitation");
      }
    });
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap" as const, gap: 10 }}>
        <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: 0 }}>Exhibitions</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{ fontSize: 12, padding: "7px 12px", borderRadius: 20, border: "1px solid", borderColor: showArchived ? "var(--pl-solid)" : "var(--pl-border-strong)", background: showArchived ? "var(--pl-solid)" : "var(--pl-surface)", color: showArchived ? "var(--pl-on-solid)" : "var(--pl-text-muted)", cursor: "pointer" }}
          >
            {showArchived ? "Showing archived" : "Show archived"}
          </button>
          <button onClick={() => setCreateOpen(true)} style={{ fontSize: 13, padding: "9px 15px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>+ New exhibition</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visible.map((ex) => {
          const meta = EX_STATUS_META[ex.status];
          const pct = ex.slots > 0 ? Math.round((ex.filled / ex.slots) * 100) : 0;
          return (
            <div
              key={ex.id}
              onClick={() => setOpenId(ex.id)}
              style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 14, padding: "20px 22px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <h3 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0 }}>{ex.title}</h3>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 4 }}>{ex.dates}</div>
                  <div style={{ fontSize: 13, color: "var(--pl-text-muted)", marginTop: 4 }}>{ex.blurb}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--pl-text-eyebrow)" }}>Slots filled</div>
                  <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{ex.filled}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--pl-text-eyebrow)" }}>/{ex.slots}</span></div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 5, borderRadius: 20, background: "var(--pl-border-strong)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: ex.status === "open" ? "var(--pl-approved-dot)" : ex.status === "planning" ? "var(--pl-pending-dot)" : ex.status === "hanging" ? "var(--pl-changes-dot)" : "var(--pl-text-faint)", borderRadius: 20 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)" }}>{ex.applicants} applicants</span>
                  <span style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)" }}>{ex.slots - ex.filled} slots remaining</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {createOpen && <CreateExhibitionDrawer onClose={() => setCreateOpen(false)} onCreate={handleCreate} />}

      {openEx && (
        <ExhibitionDetailDrawer
          ex={openEx}
          invites={invites.filter((inv) => inv.exhibitionId === openEx.id)}
          artistContacts={artistContacts}
          onClose={() => setOpenId(null)}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
          onInvite={handleInvite}
          onRevokeInvite={handleRevokeInvite}
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
