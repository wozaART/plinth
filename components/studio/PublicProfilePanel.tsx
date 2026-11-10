"use client";

import { useRef, useState, useTransition, type CSSProperties } from "react";
import {
  MAX_BIO_LENGTH,
  MAX_LINKS,
  MAX_PORTFOLIO_WORKS,
  MAX_STUDIO_PHOTOS,
  LINK_KINDS,
  type ArtistLinkKind,
} from "@/lib/artist-profile";
import { checkProfileImage, uploadProfileImage } from "@/lib/profile-image-upload";
import {
  addArtistPhoto,
  addPortfolioWork,
  deleteArtistPhoto,
  deletePortfolioWork,
  saveArtistAbout,
  updatePortfolioWork,
} from "@/lib/supabase/actions";
import type { ArtistLink, ArtistPhoto, ArtistPublicProfile, PortfolioWork } from "@/lib/types";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };
const cardStyle: CSSProperties = { background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 16, padding: "28px 30px 32px", maxWidth: 720, marginTop: 20 };
const headingStyle: CSSProperties = { fontSize: 17, fontWeight: 600, fontFamily: "var(--font-newsreader, serif)" };
const hintStyle: CSSProperties = { fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 4, lineHeight: 1.5 };
const primaryButton: CSSProperties = { background: "var(--pl-accent)", color: "var(--pl-on-accent)", border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const quietButton: CSSProperties = { background: "var(--pl-surface)", color: "var(--pl-text-muted)", border: "1px solid var(--pl-border-strong)", borderRadius: 9, padding: "8px 14px", fontSize: 13, cursor: "pointer" };

const thumb = (url: string): CSSProperties => ({ backgroundImage: `url(${JSON.stringify(url)})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--pl-sidebar)" });

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

// ── Photos ──────────────────────────────────────────────────────────────

function PhotosSection({ initialProfile, initialStudio, onNotify }: { initialProfile: ArtistPhoto | null; initialStudio: ArtistPhoto[]; onNotify: (m: string) => void }) {
  const [profilePhoto, setProfilePhoto] = useState(initialProfile);
  const [studio, setStudio] = useState(initialStudio);
  const [busy, setBusy] = useState<"profile" | "studio" | string | null>(null);
  const profileInput = useRef<HTMLInputElement>(null);
  const studioInput = useRef<HTMLInputElement>(null);

  async function upload(kind: "profile" | "studio", file: File | undefined) {
    if (!file) return;
    const problem = checkProfileImage(file);
    if (problem) return onNotify(problem);
    setBusy(kind);
    try {
      const id = crypto.randomUUID();
      const imagePath = await uploadProfileImage(id, file);
      const photo = await addArtistPhoto({ id, kind, imagePath });
      if (kind === "profile") setProfilePhoto(photo);
      else setStudio(prev => [...prev, photo]);
    } catch (err) {
      onNotify(errorMessage(err, "Couldn't upload that photo."));
    }
    setBusy(null);
  }

  async function remove(photo: ArtistPhoto) {
    setBusy(photo.id);
    try {
      await deleteArtistPhoto(photo.id);
      if (photo.kind === "profile") setProfilePhoto(null);
      else setStudio(prev => prev.filter(p => p.id !== photo.id));
    } catch (err) {
      onNotify(errorMessage(err, "Couldn't remove that photo."));
    }
    setBusy(null);
  }

  return (
    <div style={cardStyle}>
      <div style={headingStyle}>Photos</div>
      <div style={hintStyle}>Galleries see these when they open your profile.</div>

      <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
        <div role="img" aria-label={profilePhoto ? "Profile photo" : "No profile photo"} style={{ width: 96, height: 96, borderRadius: "50%", flexShrink: 0, border: "1px solid var(--pl-border)", ...(profilePhoto ? thumb(profilePhoto.imageUrl) : { background: "var(--pl-sidebar)" }) }} />
        <div>
          <div style={labelStyle}>Profile photo</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <input ref={profileInput} type="file" accept="image/*" hidden aria-label="Choose profile photo" onChange={e => { void upload("profile", e.target.files?.[0]); e.target.value = ""; }} />
            <button type="button" style={quietButton} disabled={busy !== null} onClick={() => profileInput.current?.click()}>
              {busy === "profile" ? "Uploading…" : profilePhoto ? "Replace photo" : "Upload photo"}
            </button>
            {profilePhoto && <button type="button" style={quietButton} disabled={busy !== null} onClick={() => remove(profilePhoto)}>Remove</button>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={labelStyle}>Studio photos <span style={{ textTransform: "none", letterSpacing: 0 }}>({studio.length}/{MAX_STUDIO_PHOTOS})</span></div>
        <div>
          <input ref={studioInput} type="file" accept="image/*" hidden aria-label="Choose studio photo" onChange={e => { void upload("studio", e.target.files?.[0]); e.target.value = ""; }} />
          <button type="button" style={quietButton} disabled={busy !== null || studio.length >= MAX_STUDIO_PHOTOS} onClick={() => studioInput.current?.click()}>
            {busy === "studio" ? "Uploading…" : "Add studio photo"}
          </button>
        </div>
      </div>
      {studio.length === 0 ? (
        <div style={{ ...hintStyle, marginTop: 10 }}>No studio photos yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginTop: 12 }}>
          {studio.map(p => (
            <div key={p.id} style={{ position: "relative", height: 110, borderRadius: 10, border: "1px solid var(--pl-border)", ...thumb(p.imageUrl) }} role="img" aria-label="Studio photo">
              <button type="button" aria-label="Remove studio photo" disabled={busy !== null} onClick={() => remove(p)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── About + links ───────────────────────────────────────────────────────

function AboutSection({ initial, onNotify }: { initial: Pick<ArtistPublicProfile, "bio" | "practice" | "city" | "links">; onNotify: (m: string) => void }) {
  const [bio, setBio] = useState(initial.bio);
  const [practice, setPractice] = useState(initial.practice);
  const [city, setCity] = useState(initial.city);
  const [links, setLinks] = useState<ArtistLink[]>(initial.links);
  const [saving, startSaving] = useTransition();

  function setLink(index: number, patch: Partial<ArtistLink>) {
    setLinks(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function handleSave() {
    startSaving(async () => {
      try {
        // Empty rows are just unfilled; drop them rather than complain.
        const filled = links.filter(l => l.url.trim());
        const saved = await saveArtistAbout({ bio, practice, city, links: filled });
        setLinks(saved.links);
        onNotify("Public profile saved.");
      } catch (err) {
        onNotify(errorMessage(err, "Couldn't save your profile."));
      }
    });
  }

  return (
    <div style={cardStyle}>
      <div style={headingStyle}>About you</div>
      <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px", marginTop: 20 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Practice</span><input value={practice} onChange={e => setPractice(e.target.value)} placeholder="e.g. Painter, ceramicist" style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>City</span><input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} /></label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 18 }}>
        <span style={labelStyle}>Bio</span>
        <textarea aria-label="Bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={MAX_BIO_LENGTH} rows={6} placeholder="Tell galleries about your work, training and exhibitions." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55 }} />
        <span style={{ fontSize: 11.5, color: "var(--pl-text-faint)", textAlign: "right" }}>{bio.length}/{MAX_BIO_LENGTH}</span>
      </label>

      <div style={{ ...headingStyle, marginTop: 26 }}>Websites &amp; socials</div>
      <div style={hintStyle}>Up to {MAX_LINKS} links.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {links.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <select aria-label="Link type" value={l.kind} onChange={e => setLink(i, { kind: e.target.value as ArtistLinkKind })} style={{ ...inputStyle, width: 130, flexShrink: 0 }}>
              {LINK_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
            <input aria-label="Link address" value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://" inputMode="url" style={inputStyle} />
            <button type="button" aria-label="Remove link" onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))} style={{ ...quietButton, padding: "0 12px" }}>×</button>
          </div>
        ))}
      </div>
      <button type="button" style={{ ...quietButton, marginTop: 12 }} disabled={links.length >= MAX_LINKS} onClick={() => setLinks(prev => [...prev, { kind: prev.some(l => l.kind === "website") ? "instagram" : "website", url: "" }])}>+ Add link</button>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{ ...primaryButton, opacity: saving ? 0.7 : 1, cursor: saving ? "default" : "pointer" }}>{saving ? "Saving…" : "Save about & links"}</button>
      </div>
    </div>
  );
}

// ── Portfolio ───────────────────────────────────────────────────────────

interface WorkDraft {
  id: string;
  isNew: boolean;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  imageUrl: string;
  image: File | null;
}

function PortfolioSection({ initial, onNotify }: { initial: PortfolioWork[]; onNotify: (m: string) => void }) {
  const [works, setWorks] = useState(initial);
  const [draft, setDraft] = useState<WorkDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const startNew = () => setDraft({ id: crypto.randomUUID(), isNew: true, title: "", year: "", medium: "", dimensions: "", imageUrl: "", image: null });
  const startEdit = (w: PortfolioWork) => setDraft({ id: w.id, isNew: false, title: w.title, year: w.year ? String(w.year) : "", medium: w.medium, dimensions: w.dimensions, imageUrl: w.imageUrl, image: null });

  async function handleSave() {
    if (!draft) return;
    if (!draft.title.trim()) return onNotify("Give the work a title.");
    if (draft.isNew && !draft.image) return onNotify("Add a photo of the work.");
    const year = draft.year.trim() ? Number(draft.year) : null;
    setSaving(true);
    try {
      const imagePath = draft.image ? await uploadProfileImage(draft.id, draft.image) : undefined;
      const input = { id: draft.id, title: draft.title, year, medium: draft.medium, dimensions: draft.dimensions, imagePath };
      if (draft.isNew) {
        const created = await addPortfolioWork(input);
        setWorks(prev => [...prev, created]);
      } else {
        const updated = await updatePortfolioWork(input);
        setWorks(prev => prev.map(w => (w.id === updated.id ? updated : w)));
      }
      setDraft(null);
    } catch (err) {
      onNotify(errorMessage(err, "Couldn't save that work."));
    }
    setSaving(false);
  }

  async function handleRemove(id: string) {
    if (confirmId !== id) return setConfirmId(id);
    setRemoving(id);
    try {
      await deletePortfolioWork(id);
      setWorks(prev => prev.filter(w => w.id !== id));
      setConfirmId(null);
    } catch (err) {
      onNotify(errorMessage(err, "Couldn't remove that work."));
    }
    setRemoving(null);
  }

  const atLimit = works.length >= MAX_PORTFOLIO_WORKS;
  const setField = (key: "title" | "year" | "medium" | "dimensions") => (e: { target: { value: string } }) => setDraft(d => (d ? { ...d, [key]: e.target.value } : d));

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={headingStyle}>Portfolio <span style={{ fontSize: 13, fontWeight: 400, color: "var(--pl-text-soft)" }}>({works.length}/{MAX_PORTFOLIO_WORKS})</span></div>
        <button type="button" style={quietButton} disabled={atLimit || draft !== null} onClick={startNew}>+ Add work</button>
      </div>
      <div style={hintStyle}>Show galleries up to {MAX_PORTFOLIO_WORKS} of your best pieces.{atLimit && " You've reached the limit — remove one to add another."}</div>

      {draft && (
        <div style={{ marginTop: 18, padding: 18, border: "1px solid var(--pl-border-strong)", borderRadius: 12, background: "var(--pl-bg-app)" }}>
          <div className="dash-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Title</span><input value={draft.title} onChange={setField("title")} style={inputStyle} /></label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Year</span><input value={draft.year} onChange={setField("year")} inputMode="numeric" placeholder="2025" style={inputStyle} /></label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Medium</span><input value={draft.medium} onChange={setField("medium")} placeholder="Oil on canvas" style={inputStyle} /></label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Dimensions</span><input value={draft.dimensions} onChange={setField("dimensions")} placeholder="90 × 120 cm" style={inputStyle} /></label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 14 }}>
            <span style={labelStyle}>Photo {!draft.isNew && "(leave empty to keep the current one)"}</span>
            <input
              type="file"
              accept="image/*"
              aria-label="Work photo"
              onChange={e => {
                const f = e.target.files?.[0] ?? null;
                const problem = f ? checkProfileImage(f) : null;
                if (problem) { e.target.value = ""; onNotify(problem); setDraft(d => (d ? { ...d, image: null } : d)); return; }
                setDraft(d => (d ? { ...d, image: f } : d));
              }}
              style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}
            />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" style={{ ...primaryButton, padding: "9px 22px", opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={handleSave}>{saving ? "Saving…" : draft.isNew ? "Add to portfolio" : "Save changes"}</button>
            <button type="button" style={quietButton} disabled={saving} onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}

      {works.length === 0 && !draft ? (
        <div style={{ ...hintStyle, marginTop: 16 }}>No works yet. Add your best pieces so galleries can see what you make.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginTop: 18 }}>
          {works.map(w => (
            <div key={w.id} style={{ border: "1px solid var(--pl-border)", borderRadius: 12, overflow: "hidden", background: "var(--pl-surface)" }}>
              <div role="img" aria-label={w.title} style={{ height: 140, ...thumb(w.imageUrl) }} />
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14.5, fontWeight: 600 }}>{w.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{[w.year, w.medium, w.dimensions].filter(Boolean).join(" · ")}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button type="button" style={{ ...quietButton, padding: "5px 10px", fontSize: 12 }} disabled={draft !== null} onClick={() => startEdit(w)}>Edit</button>
                  <button type="button" style={{ ...quietButton, padding: "5px 10px", fontSize: 12, ...(confirmId === w.id ? { background: "#c0392b", color: "#fff", borderColor: "#c0392b" } : {}) }} disabled={removing === w.id} onClick={() => handleRemove(w.id)}>
                    {removing === w.id ? "Removing…" : confirmId === w.id ? "Confirm?" : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicProfilePanel({ initial, onNotify }: { initial: ArtistPublicProfile; onNotify: (message: string) => void }) {
  return (
    <div>
      <div style={{ ...cardStyle, marginTop: 20, padding: "20px 30px" }}>
        <div style={headingStyle}>Your public profile</div>
        <div style={hintStyle}>This is what galleries see when they tap your name. Your contact number, email and bank details are never shown.</div>
      </div>
      <PhotosSection initialProfile={initial.profilePhoto} initialStudio={initial.studioPhotos} onNotify={onNotify} />
      <AboutSection initial={initial} onNotify={onNotify} />
      <PortfolioSection initial={initial.works} onNotify={onNotify} />
    </div>
  );
}
