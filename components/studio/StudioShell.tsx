"use client";

import { useEffect, useMemo, useState, useTransition, type CSSProperties, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { artworkBg, artworkFill, avatarBg, initials } from "@/lib/utils";
import { EX_ACCESS_META, EX_TYPE_META, STATUS_META, CAT_STATUS_META, PAYOUT_STATUS_META } from "@/lib/constants";
import { useGalleryConfig } from "@/lib/gallery-context";
import { formatCurrency } from "@/lib/currency";
import { renderCommissionNote } from "@/lib/gallery-runtime-config";
import ImageLightbox from "@/components/shared/ImageLightbox";
import ProfileDropdown from "@/components/shared/ProfileDropdown";
import ProfileSwitcher from "@/components/shared/ProfileSwitcher";
import PublicProfilePanel from "@/components/studio/PublicProfilePanel";
import { ackDeclinedSubmission, createSubmission, updateSubmission, respondToExhibitionInvite, acknowledgePayout, queryPayout, getPayoutProofSignedUrl, updateArtistProfile } from "@/lib/supabase/actions";
import ConsignmentTermsView from "@/components/ConsignmentTermsView";
import { hasConsignmentTerms, isSubmissionEditable, type ExhibitionInvite, type MyWork, type OpenCall, type StudioMessage, type CatalogueWork, type ArtistPayout, type ArtistPublicProfile } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // matches the submission-images bucket limit

type StudioTab = "overview" | "submissions" | "open-calls" | "invitations" | "messages" | "profile" | "settings" | "catalogue" | "earnings";

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  accountNumber: string;
  bankName: string;
  branchCode: string;
  accountType: string;
}

interface StudioShellProps {
  artistName: string;
  artistCity: string;
  works: MyWork[];
  catalogueWorks: CatalogueWork[];
  payouts: ArtistPayout[];
  openCalls: OpenCall[];
  exhibitionInvites: ExhibitionInvite[];
  messages: StudioMessage[];
  profile: ProfileData;
  publicProfile: ArtistPublicProfile;
  isGalleryOwner?: boolean;
}

function PayoutBanner({ payout, onAcknowledge, onQuery }: { payout: ArtistPayout; onAcknowledge: () => void; onQuery: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }} className="dash-card">
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--pl-pending-dot)", fontWeight: 600, letterSpacing: ".04em" }}>NEEDS YOUR ATTENTION</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 4 }}>A payout of {payout.amount} for &ldquo;{payout.workTitle}&rdquo; has been paid</div>
          <div style={{ fontSize: 13, color: "var(--pl-on-dark-soft)", marginTop: 4, lineHeight: 1.5 }}>
            {payout.paymentReference ? `Reference: ${payout.paymentReference}` : "Please confirm you've received this payment."}
          </div>
          {!open && <button onClick={() => setOpen(true)} style={{ fontSize: 12, color: "var(--pl-on-dark-soft)", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>Review this payout →</button>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 20, background: "var(--pl-pending-bg)", color: "var(--pl-pending-fg)", flexShrink: 0 }}>Paid</span>
      </div>
      {open && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--pl-border-dark)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onAcknowledge} style={{ background: "var(--pl-on-dark)", color: "var(--pl-surface-dark)", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            I&apos;ve received this payment
          </button>
          <button onClick={onQuery} style={{ background: "none", border: "1px solid var(--pl-border-dark)", color: "var(--pl-on-dark-soft)", borderRadius: 10, padding: "12px 20px", fontSize: 14, cursor: "pointer" }}>
            Something&apos;s not right
          </button>
        </div>
      )}
    </div>
  );
}

function BlockingBanner({ work, onAck }: { work: MyWork; onAck: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META.declined;
  return (
    <div style={{ background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }} className="dash-card">
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 50, borderRadius: 5, ...artworkFill(work.imageUrl, 0), flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: meta.dot, fontWeight: 600, letterSpacing: ".04em" }}>NEEDS YOUR ATTENTION</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 4 }}>A decision is waiting for {work.title}</div>
          <div style={{ fontSize: 13, color: "var(--pl-on-dark-soft)", marginTop: 4, lineHeight: 1.5 }}>{open ? work.note : (work.note?.slice(0, 120) + "…")}</div>
          {!open && <button onClick={() => setOpen(true)} style={{ fontSize: 12, color: "var(--pl-on-dark-soft)", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>Read the full message →</button>}
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 20, background: meta.bg, color: meta.fg }}>Not accepted</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--pl-border-dark)" }}>
          <p style={{ fontSize: 13, color: "var(--pl-on-dark-soft)", lineHeight: 1.65, margin: "0 0 16px" }}>By confirming below you acknowledge this decision. <strong style={{ color: "var(--pl-on-dark)" }}>{work.title} will not be delivered to the gallery.</strong></p>
          <button onClick={onAck} style={{ background: "var(--pl-on-dark)", color: "var(--pl-surface-dark)", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            I understand — I won&apos;t deliver this work
          </button>
        </div>
      )}
    </div>
  );
}

function CallTermsModal({ call, onCancel, onAccept }: { call: OpenCall; onCancel: () => void; onAccept: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const hasRules = Boolean(call.rules);
  const hasTerms = hasConsignmentTerms(call);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Rules and consignment terms for ${call.title}`} className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(520px,100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--pl-bg-app)", border: "1px solid var(--pl-border)", borderRadius: 14 }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--pl-border)" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Before you submit to {call.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--pl-text-eyebrow)", marginTop: 2 }}>Please review {hasRules && hasTerms ? "the rules and consignment terms" : hasRules ? "the rules" : "the consignment terms"} to continue.</div>
        </div>
        <div style={{ padding: "18px 22px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {hasRules && (
            <div style={{ background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px", fontSize: 12.5, color: "var(--pl-text-soft)", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--pl-text-secondary)" }}>Rules:</strong> {call.rules}
            </div>
          )}
          {hasTerms && (
            <div style={{ background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pl-text-secondary)", marginBottom: 8 }}>Consignment terms</div>
              <ConsignmentTermsView text={call.consignmentTermsText} pdfPath={call.consignmentTermsPdfPath} maxHeight={200} />
            </div>
          )}
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
            <span style={{ fontSize: 12.5, color: "var(--pl-text-secondary)", lineHeight: 1.5 }}>
              I have read and agree to {hasRules && hasTerms ? "the rules and consignment terms" : hasRules ? "the rules" : "the consignment terms"} for this exhibition.
            </span>
          </label>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--pl-border)", display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "var(--pl-text-secondary)" }}>Cancel</button>
          <button onClick={onAccept} disabled={!agreed} style={{ flex: 2, padding: 12, background: agreed ? "var(--pl-solid)" : "var(--pl-border-strong)", color: agreed ? "var(--pl-on-solid)" : "var(--pl-text-faint)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: agreed ? "pointer" : "not-allowed" }}>Accept &amp; continue</button>
        </div>
      </div>
    </div>
  );
}

function parseDim(dim?: string | null): [string, string, string] {
  const nums = (dim ?? "").match(/\d+(?:\.\d+)?/g) ?? [];
  return [nums[0] ?? "", nums[1] ?? "", nums[2] ?? ""];
}

const MAX_WORKS_PER_BATCH = 20;

interface WorkDraft {
  title: string;
  medium: string;
  year: string;
  height: string;
  width: string;
  depth: string;
  price: string;
  statement: string;
  image: File | null;
}

type SubmitItem = { formData: FormData; image: File | null };

const emptyDraft = (): WorkDraft => ({ title: "", medium: "", year: "", height: "", width: "", depth: "", price: "", statement: "", image: null });

function SubmitDrawer({ openCalls, commissionNoteTemplate, commissionRatePct: defaultCommissionPct, editing, initialCallId, acceptedCallId, onClose, onSubmit }: { openCalls: OpenCall[]; commissionNoteTemplate: string; commissionRatePct: number; editing?: MyWork; initialCallId?: string; acceptedCallId?: string; onClose: () => void; onSubmit: (items: SubmitItem[]) => void }) {
  // New submissions run: how many works → one form per work → review.
  // Editing skips straight to the single work's form.
  const [phase, setPhase] = useState<"count" | "work" | "review">(editing ? "work" : "count");
  const [wantedCount, setCount] = useState(1);
  const [index, setIndex] = useState(0);
  const [works, setWorks] = useState<WorkDraft[]>(() => {
    if (!editing) return [emptyDraft()];
    const [height, width, depth] = parseDim(editing.dim);
    return [{ title: editing.title ?? "", medium: editing.medium ?? "", year: editing.year ? String(editing.year) : "", height, width, depth, price: editing.price != null ? String(editing.price) : "", statement: editing.statement ?? "", image: null }];
  });
  const [exhibitionId, setExhibitionId] = useState(initialCallId ?? openCalls.find(o => o.accepting)?.id ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [rulesAck, setRulesAck] = useState(false);
  // Remembers which exhibition the terms were agreed for, so switching the
  // exhibition drops the agreement instead of carrying it over.
  const [termsAckFor, setTermsAckFor] = useState<string | null>(null);

  const work = works[index];
  const image = work.image;
  const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const selectedCall = openCalls.find(o => o.id === exhibitionId);
  // Rules and terms already accepted in the modal for this call need no second prompt.
  const preAccepted = Boolean(acceptedCallId) && acceptedCallId === exhibitionId;
  const needsRulesAck = !editing && Boolean(selectedCall?.rules) && !preAccepted;
  const needsTermsAck = !editing && Boolean(selectedCall && hasConsignmentTerms(selectedCall)) && !preAccepted;
  const termsAck = preAccepted || (termsAckFor !== null && termsAckFor === exhibitionId);
  // The exhibition may cap how many works one artist can submit; earlier ones count against it.
  const remainingWorks = !editing && selectedCall?.maxWorksPerArtist != null ? Math.max(0, selectedCall.maxWorksPerArtist - selectedCall.myWorkCount) : null;
  const maxCount = Math.min(MAX_WORKS_PER_BATCH, remainingWorks ?? MAX_WORKS_PER_BATCH);
  const count = Math.max(1, Math.min(wantedCount, maxCount));

  const priceOf = (w: WorkDraft) => Number(w.price.replace(/[^0-9.]/g, ""));
  const workValid = (w: WorkDraft) =>
    Boolean(w.title.trim() && w.medium.trim() && w.year.trim() && (w.image || editing?.imageUrl) && Number(w.height) > 0 && Number(w.width) > 0 && Number(w.depth) > 0 && priceOf(w) > 0);
  // An exhibition can set its own commission; otherwise the gallery default applies.
  const commissionRatePct = !editing && selectedCall?.commissionRatePct != null ? selectedCall.commissionRatePct : defaultCommissionPct;
  const commissionNote = renderCommissionNote(commissionNoteTemplate, commissionRatePct);
  const salePrice = priceOf(work) > 0 ? formatCurrency(priceOf(work) * (1 + commissionRatePct / 100), "ZAR") : null;

  const lastWork = index === count - 1;
  const canAdvance =
    phase === "count" ? remainingWorks !== 0 :
    phase === "work" ? workValid(work) :
    works.every(workValid) && (!needsRulesAck || rulesAck) && (!needsTermsAck || termsAck);

  // Editing is one step; otherwise: count + N works + review.
  const totalSteps = editing ? 1 : count + 2;
  const stepNo = phase === "count" ? 1 : phase === "work" ? index + 2 : count + 2;
  const stepLabel = phase === "count" ? "How many works" : phase === "work" ? (editing ? "Work details" : `Work ${index + 1} of ${count}`) : "Review & submit";

  function patch(p: Partial<WorkDraft>) {
    setWorks(ws => ws.map((w, i) => (i === index ? { ...w, ...p } : w)));
  }

  function goToWork(i: number) {
    setImageError(null);
    setIndex(i);
    setPhase("work");
  }

  function next() {
    if (!canAdvance) return;
    if (phase === "count") {
      // Resize the drafts to the chosen count, keeping anything already typed.
      setWorks(ws => Array.from({ length: count }, (_, i) => ws[i] ?? emptyDraft()));
      goToWork(0);
      return;
    }
    if (phase === "work") {
      if (editing) return submit();
      if (lastWork) { setPhase("review"); return; }
      // Works in a batch usually share a medium and year, so carry them forward.
      setWorks(ws => ws.map((w, i) => (i === index + 1 && !w.medium && !w.year ? { ...w, medium: work.medium, year: work.year } : w)));
      goToWork(index + 1);
      return;
    }
    submit();
  }

  function back() {
    if (phase === "review") goToWork(count - 1);
    else if (phase === "work" && index > 0) goToWork(index - 1);
    else setPhase("count");
  }

  function submit() {
    onSubmit(works.map(w => {
      const formData = new FormData();
      formData.set("title", w.title.trim());
      formData.set("medium", w.medium);
      formData.set("dim", `${w.height} × ${w.width} × ${w.depth} cm`);
      formData.set("year", w.year);
      formData.set("price", w.price);
      formData.set("exhibitionId", exhibitionId);
      formData.set("statement", w.statement);
      formData.set("rulesAck", String(rulesAck || preAccepted));
      formData.set("termsAck", String(termsAck));
      return { formData, image: w.image };
    }));
  }

  const buttonLabel =
    phase === "count" ? "Continue →" :
    phase === "work" ? (editing ? "Save changes" : lastWork ? "Review →" : "Next work →") :
    count === 1 ? "Submit for review" : `Submit ${count} works for review`;
  const showBack = phase !== "count" && !(editing && phase === "work");
  const fieldLabel: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };
  const fieldInput: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", minWidth: 0, width: "100%" };
  const stepperBtn: CSSProperties = { width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "var(--pl-sidebar)", fontSize: 20, color: "var(--pl-text-secondary)" };

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer" style={{ width: "min(500px,100%)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--pl-border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--pl-bg-app)" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{editing ? "Edit submission" : "Submit work"}</div>
            <div style={{ fontSize: 12, color: "var(--pl-text-eyebrow)", marginTop: 2 }}>{editing ? stepLabel : `Step ${stepNo} of ${totalSteps} · ${stepLabel}`}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 17, color: "var(--pl-text-soft)" }}>×</button>
        </div>

        <div style={{ height: 3, background: "var(--pl-border)" }}><div style={{ width: `${(stepNo / totalSteps) * 100}%`, height: "100%", background: "var(--pl-accent)", borderRadius: 2, transition: "width .2s" }} /></div>

        <div className="dash-pad" style={{ padding: 24, flex: 1 }}>
          {phase === "count" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>How many works are you submitting?</div>
                <div style={{ fontSize: 13, color: "var(--pl-text-soft)", marginTop: 4, lineHeight: 1.5 }}>You&apos;ll add the details for each work one at a time.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, padding: "10px 0" }}>
                <button type="button" aria-label="Fewer works" onClick={() => setCount(() => Math.max(1, count - 1))} disabled={count <= 1} style={{ ...stepperBtn, cursor: count <= 1 ? "not-allowed" : "pointer", opacity: count <= 1 ? 0.45 : 1 }}>−</button>
                <div aria-live="polite" style={{ minWidth: 64, textAlign: "center", fontFamily: "var(--font-newsreader, serif)", fontSize: 52, fontWeight: 500, lineHeight: 1 }}>{count}</div>
                <button type="button" aria-label="More works" onClick={() => setCount(() => Math.min(maxCount, count + 1))} disabled={count >= maxCount} style={{ ...stepperBtn, cursor: count >= maxCount ? "not-allowed" : "pointer", opacity: count >= maxCount ? 0.45 : 1 }}>+</button>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={fieldLabel}>Submitting for</span>
                <select value={exhibitionId} onChange={e => { setExhibitionId(e.target.value); setRulesAck(false); }} style={{ ...fieldInput, appearance: "none" }}>
                  <option value="">Open submissions</option>
                  {openCalls.filter(o => o.accepting).map(o => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </label>
              {selectedCall?.maxWorksPerArtist != null && (
                <div style={{ fontSize: 12.5, color: remainingWorks === 0 ? "var(--pl-declined-fg)" : "var(--pl-text-soft)", lineHeight: 1.55 }}>
                  {remainingWorks === 0
                    ? `You've already submitted the maximum of ${selectedCall.maxWorksPerArtist} ${selectedCall.maxWorksPerArtist === 1 ? "work" : "works"} to this exhibition.`
                    : `This exhibition accepts up to ${selectedCall.maxWorksPerArtist} ${selectedCall.maxWorksPerArtist === 1 ? "work" : "works"} per artist${selectedCall.myWorkCount > 0 ? ` — you can add ${remainingWorks} more` : ""}.`}
                </div>
              )}
              {selectedCall && (selectedCall.theme || selectedCall.mediumRequirements || selectedCall.sizeRequirements) && (
                <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px", lineHeight: 1.55 }}>
                  {selectedCall.theme && <div><strong style={{ color: "var(--pl-text-secondary)" }}>Theme:</strong> {selectedCall.theme}</div>}
                  {selectedCall.mediumRequirements && <div style={{ marginTop: 4 }}><strong style={{ color: "var(--pl-text-secondary)" }}>Medium:</strong> {selectedCall.mediumRequirements}</div>}
                  {selectedCall.sizeRequirements && <div style={{ marginTop: 4 }}><strong style={{ color: "var(--pl-text-secondary)" }}>Size:</strong> {selectedCall.sizeRequirements}</div>}
                </div>
              )}
            </div>
          )}

          {phase === "work" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={fieldLabel}>Title</span>
                <input value={work.title} onChange={e => patch({ title: e.target.value })} placeholder="Work title" style={fieldInput} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={fieldLabel}>Medium</span>
                  <input value={work.medium} onChange={e => patch({ medium: e.target.value })} placeholder="e.g. Oil on canvas" style={fieldInput} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={fieldLabel}>Year</span>
                  <input value={work.year} onChange={e => patch({ year: e.target.value })} placeholder="2024" style={fieldInput} />
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={fieldLabel}>{editing?.imageUrl ? "Replace image" : "Image"}</span>
                {(imagePreview || editing?.imageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview ?? editing?.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "contain", background: "var(--pl-sidebar)", borderRadius: 9 }} />
                )}
                <input key={index} type="file" accept="image/*" required onChange={e => { const f = e.target.files?.[0] ?? null; if (f && f.size > MAX_IMAGE_BYTES) { e.target.value = ""; setImageError("Image must be 10 MB or smaller."); patch({ image: null }); return; } setImageError(null); patch({ image: f }); }} style={{ fontSize: 13, color: "var(--pl-text-secondary)" }} />
                {imageError && <span style={{ fontSize: 12, color: "var(--pl-declined-fg)" }}>{imageError}</span>}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={fieldLabel}>Height (cm)</span>
                  <input inputMode="decimal" value={work.height} onChange={e => patch({ height: e.target.value })} placeholder="e.g. 80" style={fieldInput} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={fieldLabel}>Width (cm)</span>
                  <input inputMode="decimal" value={work.width} onChange={e => patch({ width: e.target.value })} placeholder="e.g. 60" style={fieldInput} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={fieldLabel}>Depth (cm)</span>
                  <input inputMode="decimal" value={work.depth} onChange={e => patch({ depth: e.target.value })} placeholder="e.g. 4" style={fieldInput} />
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={fieldLabel}>Asking price (excl. commission)</span>
                <input value={work.price} onChange={e => patch({ price: e.target.value })} placeholder="e.g. R 18 000" style={fieldInput} />
              </label>
              {salePrice && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13.5, color: "var(--pl-text)", background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px" }}>
                  <span style={fieldLabel}>Sale price to collectors</span>
                  <strong>{salePrice}</strong>
                </div>
              )}
              <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px", lineHeight: 1.55 }}>
                {commissionNote}
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={fieldLabel}>Artist statement (optional)</span>
                <textarea value={work.statement} onChange={e => patch({ statement: e.target.value })} rows={4} placeholder="Briefly describe the work — your intent, materials, series context. 80–150 words is ideal." style={{ ...fieldInput, resize: "none" }} />
              </label>
            </div>
          )}

          {phase === "review" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {works.map((w, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--pl-sidebar)", borderRadius: 9, padding: "11px 14px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {w.title}</div>
                      <div style={{ fontSize: 12, color: "var(--pl-text-soft)", marginTop: 2 }}>{w.medium}, {w.year} · {w.height} × {w.width} × {w.depth} cm</div>
                    </div>
                    <button type="button" onClick={() => goToWork(i)} style={{ fontSize: 12.5, background: "none", border: "none", color: "var(--pl-text-secondary)", textDecoration: "underline", cursor: "pointer", flexShrink: 0 }}>Edit</button>
                  </div>
                ))}
              </div>
              {needsRulesAck && selectedCall && (
                <div style={{ background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", lineHeight: 1.55, marginBottom: 10 }}>
                    <strong style={{ color: "var(--pl-text-secondary)" }}>Rules for {selectedCall.title}:</strong> {selectedCall.rules}
                  </div>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={rulesAck} onChange={e => setRulesAck(e.target.checked)} style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, color: "var(--pl-text-secondary)", lineHeight: 1.5 }}>I have read and understand the rules for this exhibition.</span>
                  </label>
                </div>
              )}
              {needsTermsAck && selectedCall && (
                <div style={{ background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pl-text-secondary)", marginBottom: 8 }}>Consignment terms for {selectedCall.title}</div>
                  <ConsignmentTermsView text={selectedCall.consignmentTermsText} pdfPath={selectedCall.consignmentTermsPdfPath} maxHeight={180} />
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", marginTop: 12 }}>
                    <input type="checkbox" checked={termsAck} onChange={e => setTermsAckFor(e.target.checked ? exhibitionId : null)} style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, color: "var(--pl-text-secondary)", lineHeight: 1.5 }}>I have read and agree to the consignment terms for this exhibition.</span>
                  </label>
                </div>
              )}
              <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", lineHeight: 1.55 }}>After submitting, the gallery will review your {count === 1 ? "work" : "works"} and respond with either an approval (including a drop-off pass) or a note explaining their decision.</div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--pl-border)", display: "flex", gap: 10 }}>
          {showBack && <button onClick={back} style={{ flex: 1, padding: "12px", background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "var(--pl-text-secondary)" }}>Back</button>}
          <button onClick={next} disabled={!canAdvance} style={{ flex: 2, padding: "12px", background: canAdvance ? "var(--pl-solid)" : "var(--pl-border-strong)", color: canAdvance ? "var(--pl-on-solid)" : "var(--pl-text-faint)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: canAdvance ? "pointer" : "not-allowed" }}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

function ProfilePanel({ initial, onNotify }: { initial: ProfileData; onNotify: (message: string) => void }) {
  const [showAccount, setShowAccount] = useState(false);
  const [saving, startSaving] = useTransition();
  const [profile, setProfile] = useState(initial);

  function set<K extends keyof typeof profile>(key: K) {
    return (e: ChangeEvent<HTMLInputElement>) => setProfile(p => ({ ...p, [key]: e.target.value }));
  }

  function handleSave() {
    startSaving(async () => {
      try {
        await updateArtistProfile(profile);
        onNotify("Profile saved.");
      } catch (err) {
        onNotify(err instanceof Error ? err.message : "Couldn't save your profile.");
      }
    });
  }

  return (
    <div style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 16, padding: "28px 30px 32px", maxWidth: 720 }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, fontFamily: "var(--font-newsreader, serif)" }}>Personal details</div>
      <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>First name</span><input value={profile.firstName} onChange={set("firstName")} style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Last name</span><input value={profile.lastName} onChange={set("lastName")} style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Contact number</span><input value={profile.phone} onChange={set("phone")} placeholder="082 000 0000" style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Email</span><input value={profile.email} readOnly style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }} /></label>
      </div>

      <div style={{ fontSize: 17, fontWeight: 600, margin: "28px 0 20px", fontFamily: "var(--font-newsreader, serif)" }}>Bank details</div>
      <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={labelStyle}>Account number</span>
          <div style={{ position: "relative" }}>
            <input
              value={showAccount ? profile.accountNumber : "•".repeat(profile.accountNumber.length)}
              onChange={set("accountNumber")}
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowAccount(s => !s)} style={{ position: "absolute", right: 4, top: 4, bottom: 4, background: "none", border: "none", cursor: "pointer", color: "var(--pl-text-soft)", padding: "0 8px" }}>
              {showAccount ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Bank name</span><input value={profile.bankName} onChange={set("bankName")} style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Branch code</span><input value={profile.branchCode} onChange={set("branchCode")} style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Account type</span><input value={profile.accountType} onChange={set("accountType")} style={inputStyle} /></label>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{ background: "var(--pl-accent)", color: "var(--pl-on-accent)", border: "none", borderRadius: 10, padding: "12px 34px", fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Update & save"}
        </button>
      </div>
    </div>
  );
}

export default function StudioShell({ artistName, artistCity, works: initialWorks, catalogueWorks, payouts: initialPayouts, openCalls, exhibitionInvites: initialInvites, messages, profile, publicProfile, isGalleryOwner = false }: StudioShellProps) {
  const router = useRouter();
  const [tab, setTabState] = useState<StudioTab>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const setTab = (t: StudioTab) => { setTabState(t); setNavOpen(false); };
  const [works, setWorks] = useState(initialWorks);
  // Re-sync after router.refresh() brings in new/edited submissions.
  const [seenWorks, setSeenWorks] = useState(initialWorks);
  if (seenWorks !== initialWorks) {
    setSeenWorks(initialWorks);
    setWorks(initialWorks);
  }
  const [payouts, setPayouts] = useState(initialPayouts);
  const [invites, setInvites] = useState(initialInvites);
  const [showSubmit, setShowSubmit] = useState(false);
  const [termsCall, setTermsCall] = useState<OpenCall | null>(null);
  const [submitCall, setSubmitCall] = useState<{ id: string; accepted: boolean } | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [editingWork, setEditingWork] = useState<MyWork | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startInviteTransition] = useTransition();

  const payoutNeedingAck = payouts.find(p => p.status === "paid");

  function handleAcknowledgePayout(id: string) {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "acknowledged" } : p));
    setToast("Payout acknowledged.");
    setTimeout(() => setToast(null), 3000);
    void acknowledgePayout(id);
  }

  function handleQueryPayout(id: string) {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "queried" } : p));
    setToast("We've flagged this payout for the gallery to review.");
    setTimeout(() => setToast(null), 3500);
    void queryPayout(id);
  }

  async function viewProofOfPayment(id: string) {
    const url = await getPayoutProofSignedUrl(id);
    if (url) window.open(url, "_blank");
    else {
      setToast("No proof of payment has been uploaded for this payout.");
      setTimeout(() => setToast(null), 3500);
    }
  }

  function respondInvite(id: string, response: "accepted" | "declined") {
    setInvites(prev => prev.map(i => (i.id === id ? { ...i, status: response, respondedAt: new Date().toISOString() } : i)));
    startInviteTransition(async () => {
      try {
        await respondToExhibitionInvite(id, response);
      } catch {
        setToast("Something went wrong responding to that invitation.");
        setTimeout(() => setToast(null), 3500);
      }
    });
  }

  const unacknowledged = works.find(w => w.status === "declined" && w.ack === false);

  function ackWork() {
    setWorks(prev => prev.map(w => w.ack === false ? { ...w, ack: true } : w));
    setToast("Decision acknowledged.");
    setTimeout(() => setToast(null), 3000);
    if (unacknowledged) void ackDeclinedSubmission(unacknowledged.id);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  // Uploads straight from the browser to Storage (server actions cap bodies
  // at 1 MB). Returns the object path, or throws so the caller can tell the
  // artist rather than silently dropping the image.
  async function uploadSubmissionImage(submissionId: string, image: File) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");
    const ext = (image.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    // Unique name per upload so a replaced image never serves a stale CDN copy.
    const path = `${user.id}/${submissionId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("submission-images").upload(path, image, { contentType: image.type });
    if (error) throw error;
    return path;
  }

  async function handleSubmitWork(items: { formData: FormData; image: File | null }[]) {
    const editing = editingWork;
    setShowSubmit(false);
    setEditingWork(null);
    let done = 0;
    let lastTitle = "";
    try {
      for (const { formData, image } of items) {
        const submissionId = editing?.id ?? crypto.randomUUID();
        if (image) formData.set("imagePath", await uploadSubmissionImage(submissionId, image));
        if (editing) {
          const result = await updateSubmission(editing.id, formData);
          setWorks(prev => prev.map(w => w.id === editing.id ? { ...w, status: "pending", title: result.title } : w));
          lastTitle = result.title;
        } else {
          formData.set("id", submissionId);
          lastTitle = (await createSubmission(formData)).title;
        }
        done++;
      }
      if (editing) setToast(`"${lastTitle}" updated.`);
      else setToast(done === 1 ? `"${lastTitle}" submitted for review.` : `${done} works submitted for review.`);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Something went wrong submitting your work.";
      setToast(done > 0 ? `${done} of ${items.length} works submitted. ${msg}` : msg);
    }
    router.refresh();
    setTimeout(() => setToast(null), 3500);
  }

  const gallery = useGalleryConfig();
  const { identity, business, copy } = gallery;
  const studioNav = gallery.nav.studioTabs.filter(t => t.enabled);

  return (
    <div className="dash-root" style={{ display: "flex", overflow: "hidden", background: "var(--pl-surface-dark)" }}>
      {navOpen && <div className="dash-overlay" onClick={() => setNavOpen(false)} />}
      {/* Sidebar */}
      <aside className={`dash-aside${navOpen ? " open" : ""}`} style={{ width: 220, flexShrink: 0, background: "var(--pl-surface-dark)", borderRight: "1px solid var(--pl-border-dark)", display: "flex", flexDirection: "column", padding: "18px 0 20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "0 18px 20px" }}>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 600, color: "var(--pl-on-dark)" }}>{identity.logoWordmark?.primary ?? identity.shortName}</span>
          {identity.logoWordmark?.secondary && (
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 9, letterSpacing: ".3em", color: "var(--pl-on-dark-soft)" }}>{identity.logoWordmark.secondary}</span>
          )}
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--pl-accent)", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>

        {isGalleryOwner ? (
          <ProfileDropdown
            current="artist"
            tone="dark"
            options={[
              { kind: "gallery", name: identity.name, detail: identity.city, href: "/dashboard" },
              { kind: "artist", name: artistName, detail: artistCity || "Artist studio", href: "/studio" },
            ]}
          />
        ) : (
        <div style={{ padding: "11px 18px", borderTop: "1px solid var(--pl-border-dark)", borderBottom: "1px solid var(--pl-border-dark)", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarBg(7), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(artistName)}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pl-on-dark)" }}>{artistName}</div>
              <div style={{ fontSize: 11, color: "var(--pl-on-dark-faint)" }}>{artistCity}</div>
            </div>
          </div>
        </div>
        )}

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {studioNav.map(item => (
            <button key={item.id} onClick={() => setTab(item.id as StudioTab)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === item.id ? "rgba(255,255,255,.08)" : "transparent", color: tab === item.id ? "var(--pl-on-dark)" : "var(--pl-on-dark-faint)", fontSize: 14, fontWeight: tab === item.id ? 600 : 400, textAlign: "left" }}>
              {item.label}
              {item.id === "messages" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--pl-accent)", display: "inline-block" }} />}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 10px 0", borderTop: "1px solid var(--pl-border-dark)" }}>
          <button onClick={() => setTab("settings")} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13, color: tab === "settings" ? "var(--pl-on-dark)" : "var(--pl-on-dark-faint)", background: tab === "settings" ? "rgba(255,255,255,.08)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 14 }}>⚙</span> Settings
          </button>
          <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "var(--pl-declined-fg)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 14 }}>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, background: "var(--pl-bg-app)", color: "var(--pl-text)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="dash-mobile-bar">
          <button onClick={() => setNavOpen(true)} aria-label="Open navigation" style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--pl-border)", background: "var(--pl-surface)", color: "var(--pl-text)", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>☰</button>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{identity.logoWordmark?.primary ?? identity.shortName}</span>
        </div>
        <div className="dash-head" style={{ height: 56, borderBottom: "1px solid var(--pl-border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0, background: "var(--pl-bg-app)" }}>
          <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0, flex: 1, textTransform: "capitalize" }}>
            {tab === "open-calls" ? "Open calls" : tab}
          </h1>
          {tab === "invitations" && invites.filter(i => i.status === "pending").length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--pl-pending-bg)", color: "var(--pl-pending-fg)" }}>
              {invites.filter(i => i.status === "pending").length} awaiting response
            </span>
          )}
          {tab === "submissions" && (
            <button onClick={() => { setEditingWork(null); setSubmitCall(null); setShowSubmit(true); }} style={{ fontSize: 13, padding: "9px 15px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>Submit work</button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl dash-pad">
          {tab === "overview" && (
            <div>
              {unacknowledged && <BlockingBanner work={unacknowledged} onAck={ackWork} />}
              {payoutNeedingAck && <PayoutBanner payout={payoutNeedingAck} onAcknowledge={() => handleAcknowledgePayout(payoutNeedingAck.id)} onQuery={() => handleQueryPayout(payoutNeedingAck.id)} />}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Submitted", value: works.length },
                  { label: "Approved", value: works.filter(w => w.status === "approved").length },
                  { label: "Pending", value: works.filter(w => w.status === "pending").length },
                  { label: "Open calls", value: openCalls.filter(o => o.accepting).length },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 28, fontFamily: "var(--font-newsreader, serif)", fontWeight: 550, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 6 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 550, margin: 0 }}>Recent work</h2>
                <button onClick={() => setTab("submissions")} style={{ fontSize: 12.5, color: "var(--pl-accent)", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {works.slice(0, 3).map((w, i) => {
                  const meta = STATUS_META[w.status];
                  return (
                    <div key={w.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 12, padding: "13px 15px", display: "flex", alignItems: "center", gap: 13 }}>
                      <div style={{ width: 42, height: 52, borderRadius: 5, ...artworkFill(w.imageUrl, i), flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 15, fontWeight: 600 }}>{w.title}</div>
                        <div style={{ fontSize: 12, color: "var(--pl-text-soft)", marginTop: 2 }}>{w.medium} · {w.year}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{meta.label}</span>
                        {w.status === "declined" && w.ack === false && (
                          <div style={{ fontSize: 10, color: "var(--pl-declined-dot)", marginTop: 5, textAlign: "right" }}>⏳ Unread</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "submissions" && (
            <div>
              {unacknowledged && <BlockingBanner work={unacknowledged} onAck={ackWork} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {works.map((w, i) => {
                  const meta = STATUS_META[w.status];
                  return (
                    <div key={w.id} style={{ background: "var(--pl-surface)", border: "1px solid", borderColor: w.status === "declined" && w.ack === false ? "var(--pl-declined-panel-border)" : "var(--pl-border)", borderRadius: 13, overflow: "hidden" }}>
                      <div style={{ display: "flex", gap: 14, padding: "15px 17px", alignItems: "center" }}>
                        <div
                          onClick={w.imageUrl ? () => setZoomImage({ url: w.imageUrl!, title: w.title }) : undefined}
                          role={w.imageUrl ? "button" : undefined}
                          aria-label={w.imageUrl ? `View ${w.title} full size` : undefined}
                          title={w.imageUrl ? "View full size" : undefined}
                          style={{ width: 50, height: 62, borderRadius: 5, ...artworkFill(w.imageUrl, i), flexShrink: 0, cursor: w.imageUrl ? "zoom-in" : undefined }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600 }}>{w.title}</div>
                          <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{w.medium} · {w.year}</div>
                          <div style={{ fontSize: 11.5, color: "var(--pl-text-faint)", marginTop: 3 }}>Submitted {w.date}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg, flexShrink: 0 }}>{meta.label}</span>
                        {isSubmissionEditable(w.status) ? (
                          <button onClick={() => { setEditingWork(w); setSubmitCall(null); setShowSubmit(true); }} style={{ fontSize: 12, padding: "6px 12px", border: "1px solid var(--pl-border-strong)", borderRadius: 8, background: "none", color: "var(--pl-text-secondary)", cursor: "pointer", flexShrink: 0 }}>Edit</button>
                        ) : w.status === "approved" ? (
                          <span title="Approved works can no longer be edited" style={{ fontSize: 11.5, color: "var(--pl-text-faint)", flexShrink: 0 }}>🔒 Locked</span>
                        ) : null}
                      </div>
                      {w.note && (
                        <div style={{ padding: "12px 17px", borderTop: "1px solid var(--pl-divider)", background: w.status === "declined" && w.ack === false ? "var(--pl-declined-panel-bg)" : "var(--pl-sidebar)" }}>
                          <div style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)", marginBottom: 5 }}>Gallery note</div>
                          <p style={{ fontSize: 13, color: "var(--pl-text-secondary)", lineHeight: 1.6, margin: 0 }}>{w.note}</p>
                          {w.status === "approved" && (
                            <div style={{ marginTop: 11, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--pl-approved-panel-bg)", color: "var(--pl-approved-fg)", padding: "7px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600 }}>
                              📋 Drop-off pass issued · {business.dropOffPassPrefix}14
                            </div>
                          )}
                          {w.status === "declined" && w.ack === false && (
                            <button onClick={ackWork} style={{ marginTop: 12, background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                              I understand — I won&apos;t deliver this work
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "open-calls" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {openCalls.map((oc) => (
                <div key={oc.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" as const }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0 }}>{oc.title}</h3>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>{EX_TYPE_META[oc.type]}</span>
                        {oc.access === "closed" && <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>{EX_ACCESS_META[oc.access]}</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 3 }}>{oc.gallery}</div>
                      <div style={{ fontSize: 13.5, color: "var(--pl-text-secondary)", marginTop: 6 }}>{oc.focus}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {oc.accepting ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--pl-approved-bg)", color: "var(--pl-approved-fg)" }}>Accepting</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>Closed</span>
                      )}
                      <div style={{ fontSize: 12, color: "var(--pl-text-eyebrow)", marginTop: 6 }}>Deadline: {oc.deadline}</div>
                    </div>
                  </div>
                  {(oc.theme || oc.mediumRequirements || oc.sizeRequirements || oc.rules || hasConsignmentTerms(oc)) && (
                    <div style={{ marginTop: 14, background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px", fontSize: 12.5, color: "var(--pl-text-soft)", lineHeight: 1.6 }}>
                      {oc.theme && <div><strong style={{ color: "var(--pl-text-secondary)" }}>Theme:</strong> {oc.theme}</div>}
                      {oc.mediumRequirements && <div><strong style={{ color: "var(--pl-text-secondary)" }}>Medium:</strong> {oc.mediumRequirements}</div>}
                      {oc.sizeRequirements && <div><strong style={{ color: "var(--pl-text-secondary)" }}>Size:</strong> {oc.sizeRequirements}</div>}
                      {oc.rules && <div><strong style={{ color: "var(--pl-text-secondary)" }}>Rules:</strong> {oc.rules}</div>}
                      {hasConsignmentTerms(oc) && (
                        <div style={{ marginTop: 8 }}>
                          <strong style={{ color: "var(--pl-text-secondary)" }}>Consignment terms</strong> (you&apos;ll agree to these when you submit)
                          <div style={{ marginTop: 6 }}><ConsignmentTermsView text={oc.consignmentTermsText} pdfPath={oc.consignmentTermsPdfPath} maxHeight={140} /></div>
                        </div>
                      )}
                    </div>
                  )}
                  {oc.accepting && (
                    <button onClick={() => { setEditingWork(null); if (oc.rules || hasConsignmentTerms(oc)) setTermsCall(oc); else { setSubmitCall({ id: oc.id, accepted: false }); setShowSubmit(true); } }} style={{ marginTop: 16, padding: "10px 16px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>
                      Submit for this call
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "invitations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {invites.length === 0 && (
                <div style={{ fontSize: 13.5, color: "var(--pl-text-soft)" }}>No exhibition invitations yet.</div>
              )}
              {invites.map((inv) => (
                <div key={inv.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 13, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600 }}>{inv.exhibitionTitle}</div>
                      {inv.message && <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: "6px 0 0", lineHeight: 1.55, fontStyle: "italic" }}>&ldquo;{inv.message}&rdquo;</p>}
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" as const, background: inv.status === "pending" ? "var(--pl-pending-bg)" : inv.status === "accepted" ? "var(--pl-approved-bg)" : "var(--pl-neutral-chip-bg)", color: inv.status === "pending" ? "var(--pl-pending-fg)" : inv.status === "accepted" ? "var(--pl-approved-fg)" : "var(--pl-neutral-chip-fg)" }}>
                      {inv.status === "pending" ? "Awaiting response" : inv.status[0].toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  {inv.status === "pending" && (
                    <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                      <button onClick={() => respondInvite(inv.id, "accepted")} style={{ padding: "9px 16px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 550, cursor: "pointer" }}>Accept</button>
                      <button onClick={() => respondInvite(inv.id, "declined")} style={{ padding: "9px 16px", background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, fontSize: 13, color: "var(--pl-text-secondary)", cursor: "pointer" }}>Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "messages" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 13, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--pl-solid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--pl-on-solid)" }}>{identity.shortName.slice(0, 2).toUpperCase()}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{msg.from}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--pl-text-faint)" }}>{msg.time}</div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 550, marginBottom: 7 }}>{msg.preview}</div>
                  <p style={{ fontSize: 13, color: "var(--pl-text-muted)", lineHeight: 1.6, margin: 0 }}>{msg.body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "catalogue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {catalogueWorks.length === 0 && (
                <div style={{ fontSize: 13.5, color: "var(--pl-text-soft)" }}>Nothing in the gallery&apos;s catalogue yet — accepted work will show up here once it&apos;s consigned.</div>
              )}
              {catalogueWorks.map((w, i) => {
                const meta = CAT_STATUS_META[w.status];
                return (
                  <div key={w.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 13, display: "flex", gap: 14, padding: "15px 17px", alignItems: "center" }}>
                    <div style={{ width: 50, height: 62, borderRadius: 5, background: artworkBg(i), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600 }}>{w.title}</div>
                      <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{w.price}</div>
                      <div style={{ fontSize: 11.5, color: "var(--pl-text-faint)", marginTop: 3 }}>Consigned {w.consignedDate}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg, flexShrink: 0, textTransform: "capitalize" }}>{w.status}</span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "earnings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {payouts.length === 0 && (
                <div style={{ fontSize: 13.5, color: "var(--pl-text-soft)" }}>No payouts yet — these show up here once the gallery records a sale of your work.</div>
              )}
              {payouts.map((p) => {
                const meta = PAYOUT_STATUS_META[p.status];
                return (
                  <div key={p.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 13, padding: "15px 17px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600 }}>{p.workTitle}</div>
                        <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{p.amount} · Due {p.dueDate}</div>
                        {p.status !== "due" && <div style={{ fontSize: 11.5, color: "var(--pl-text-faint)", marginTop: 3 }}>Paid {p.paidDate}{p.paymentReference ? ` · Ref ${p.paymentReference}` : ""}</div>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg, flexShrink: 0 }}>{meta.label}</span>
                    </div>
                    {(p.status === "paid" || p.hasProofOfPayment) && (
                      <div style={{ display: "flex", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--pl-divider)", flexWrap: "wrap" }}>
                        {p.hasProofOfPayment && (
                          <button onClick={() => viewProofOfPayment(p.id)} style={{ fontSize: 12.5, padding: "8px 14px", background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, color: "var(--pl-text-secondary)", cursor: "pointer" }}>
                            View proof of payment
                          </button>
                        )}
                        {p.status === "paid" && (
                          <>
                            <button onClick={() => handleAcknowledgePayout(p.id)} style={{ fontSize: 12.5, padding: "8px 14px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, cursor: "pointer" }}>
                              I&apos;ve received this
                            </button>
                            <button onClick={() => handleQueryPayout(p.id)} style={{ fontSize: 12.5, padding: "8px 14px", background: "none", border: "1px solid var(--pl-border)", borderRadius: 9, color: "var(--pl-text-secondary)", cursor: "pointer" }}>
                              Something&apos;s not right
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "settings" && (
            isGalleryOwner
              ? <ProfileSwitcher current="artist" />
              : <div style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 16, padding: "22px 24px", maxWidth: 720, fontSize: 13, color: "var(--pl-text-muted)" }}>No settings to manage yet.</div>
          )}
          {tab === "profile" && (() => {
            const notify = (message: string) => { setToast(message); setTimeout(() => setToast(null), 3000); };
            return (
              <>
                <ProfilePanel initial={profile} onNotify={notify} />
                <PublicProfilePanel initial={publicProfile} onNotify={notify} />
              </>
            );
          })()}
        </div>
      </main>

      {zoomImage && <ImageLightbox url={zoomImage.url} alt={zoomImage.title} onClose={() => setZoomImage(null)} />}
      {termsCall && <CallTermsModal call={termsCall} onCancel={() => setTermsCall(null)} onAccept={() => { setSubmitCall({ id: termsCall.id, accepted: true }); setTermsCall(null); setShowSubmit(true); }} />}
      {showSubmit && <SubmitDrawer key={`${editingWork?.id ?? "new"}-${submitCall?.id ?? ""}`} initialCallId={editingWork ? undefined : submitCall?.id} acceptedCallId={submitCall?.accepted ? submitCall.id : undefined} openCalls={openCalls} commissionNoteTemplate={copy.submitCommissionNoteTemplate} commissionRatePct={Math.round(business.commissionRate * 100)} editing={editingWork ?? undefined} onClose={() => { setShowSubmit(false); setEditingWork(null); setSubmitCall(null); }} onSubmit={handleSubmitWork} />}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
