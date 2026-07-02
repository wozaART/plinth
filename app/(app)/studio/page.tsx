"use client";

import { useState, type CSSProperties, type ChangeEvent } from "react";
import Link from "next/link";
import { artworkBg, avatarBg } from "@/lib/utils";
import { STATUS_META } from "@/lib/constants";
import { galleryConfig } from "@/lib/gallery.config";

type StudioTab = "overview" | "submissions" | "open-calls" | "messages" | "profile";

interface MyWork {
  id: string;
  title: string;
  year: number;
  medium: string;
  status: "pending" | "approved" | "declined" | "changes";
  date: string;
  note?: string;
  ack?: boolean;
}

const MY_WORKS: MyWork[] = [
  { id: "w1", title: "City Grid", year: 2023, medium: "Oil on canvas", status: "declined", date: "2 weeks ago", note: "Thank you for submitting. The work is accomplished, but City Grid falls outside the landscape focus of this particular exhibition. We'd warmly welcome a submission for our autumn open call.", ack: false },
  { id: "w2", title: "Rooftop Study", year: 2024, medium: "Watercolour on paper", status: "approved", date: "1 week ago", note: "A beautiful, quiet piece — exactly the counterpoint the south wall needs. Please see your drop-off pass for delivery details." },
  { id: "w3", title: "Archive Fragment III", year: 2024, medium: "Mixed media on board", status: "changes", date: "3 days ago", note: "We love the direction. Could you reconsider the framing? The bare edge is drawing the eye away from the work. A thin, neutral float would help." },
  { id: "w4", title: "Long Street, Dawn", year: 2024, medium: "Acrylic on linen", status: "pending", date: "Today" },
];

const OPEN_CALLS = [
  { title: "Highveld Light", gallery: galleryConfig.identity.name, deadline: "15 Jul 2025", focus: "Landscape & memory of the interior", accepting: true },
  { title: "Clay & Country", gallery: galleryConfig.identity.name, deadline: "Closed", focus: "Ceramics & sculpture from the Karoo", accepting: false },
  { title: "New Ground: Emerging Voices", gallery: galleryConfig.identity.name, deadline: "1 Aug 2025", focus: "Solo & duo presentations · under-35 artists", accepting: true },
];

const MESSAGES = [
  { from: galleryConfig.identity.name, time: "2 days ago", preview: "Re: Archive Fragment III — Drop-off details", body: "Hi Tariq, just following up on the framing note — when you're happy with the change, please let us know and we'll issue the drop-off pass. Looking forward to seeing it." },
  { from: galleryConfig.identity.name, time: "1 week ago", preview: "Rooftop Study — approved & drop-off pass", body: `Your work has been selected for Highveld Light. Please find attached your drop-off pass with reference ${galleryConfig.business.dropOffPassPrefix}14. Delivery to ${galleryConfig.business.deliveryAddress}. No unscheduled deliveries please.` },
];

const STUDIO_NAV = galleryConfig.nav.studioTabs.filter(t => t.enabled);

function BlockingBanner({ work, onAck }: { work: MyWork; onAck: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META.declined;
  return (
    <div style={{ background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 50, borderRadius: 5, background: artworkBg(0), flexShrink: 0 }} />
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
          <p style={{ fontSize: 13, color: "var(--pl-on-dark-soft)", lineHeight: 1.65, margin: "0 0 16px" }}>By confirming below you acknowledge this decision. <strong style={{ color: "var(--pl-on-dark)" }}>City Grid will not be delivered to the gallery.</strong></p>
          <button onClick={onAck} style={{ background: "var(--pl-on-dark)", color: "var(--pl-surface-dark)", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            I understand — I won&apos;t deliver this work
          </button>
        </div>
      )}
    </div>
  );
}

function SubmitDrawer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", medium: "", dim: "", year: "", price: "", exhibition: "Highveld Light", statement: "" });

  function next() { if (step < 3) setStep(step + 1); else { onSubmit(form.title || "Untitled"); } }
  const stepLabels = ["Work details", "Dimensions & price", "Statement"];

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer" style={{ width: "min(500px,100%)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--pl-border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--pl-bg-app)" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Submit work</div>
            <div style={{ fontSize: 12, color: "var(--pl-text-eyebrow)", marginTop: 2 }}>Step {step} of 3 · {stepLabels[step - 1]}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 17, color: "var(--pl-text-soft)" }}>×</button>
        </div>

        <div style={{ height: 3, background: "var(--pl-border)" }}><div style={{ width: `${(step / 3) * 100}%`, height: "100%", background: "var(--pl-accent)", borderRadius: 2 }} /></div>

        <div style={{ padding: 24, flex: 1 }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Title</span>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Work title" style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Medium</span>
                <input value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} placeholder="e.g. Oil on canvas" style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Year</span>
                <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Submitting for</span>
                <select value={form.exhibition} onChange={e => setForm(f => ({ ...f, exhibition: e.target.value }))} style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", appearance: "none" }}>
                  <option>Highveld Light</option>
                  <option>New Ground: Emerging Voices</option>
                  <option>Open submissions</option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Dimensions</span>
                <input value={form.dim} onChange={e => setForm(f => ({ ...f, dim: e.target.value }))} placeholder="e.g. 80 × 60 cm" style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Asking price (excl. commission)</span>
                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. R 18 000" style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)" }} />
              </label>
              <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", background: "var(--pl-sidebar)", borderRadius: 9, padding: "12px 14px", lineHeight: 1.55 }}>
                {galleryConfig.copy.submitCommissionNote(Math.round(galleryConfig.business.commissionRate * 100))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" }}>Artist statement</span>
                <textarea value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))} rows={5} placeholder="Briefly describe the work — your intent, materials, series context. 80–150 words is ideal." style={{ background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", resize: "none" }} />
              </label>
              <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", lineHeight: 1.55 }}>After submitting, the gallery will review your work and respond with either an approval (including a drop-off pass) or a note explaining their decision.</div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--pl-border)", display: "flex", gap: 10 }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: "12px", background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "var(--pl-text-secondary)" }}>Back</button>}
          <button onClick={next} style={{ flex: 2, padding: "12px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: "pointer" }}>
            {step < 3 ? "Continue →" : "Submit for review"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

function ProfilePanel() {
  const [showAccount, setShowAccount] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "Tariq",
    lastName: "Hendricks",
    phone: "",
    email: "",
    accountNumber: "62834571903",
    bankName: "",
    branchCode: "",
    accountType: "Cheque",
  });

  function set<K extends keyof typeof profile>(key: K) {
    return (e: ChangeEvent<HTMLInputElement>) => setProfile(p => ({ ...p, [key]: e.target.value }));
  }

  return (
    <div style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 16, padding: "28px 30px 32px", maxWidth: 720 }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, fontFamily: "var(--font-newsreader, serif)" }}>Personal details</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>First name</span><input value={profile.firstName} onChange={set("firstName")} style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Last name</span><input value={profile.lastName} onChange={set("lastName")} style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Contact number</span><input value={profile.phone} onChange={set("phone")} placeholder="082 000 0000" style={inputStyle} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={labelStyle}>Email</span><input value={profile.email} onChange={set("email")} placeholder="you@example.com" style={inputStyle} /></label>
      </div>

      <div style={{ fontSize: 17, fontWeight: 600, margin: "28px 0 20px", fontFamily: "var(--font-newsreader, serif)" }}>Bank details</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
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
        <button style={{ background: "var(--pl-accent)", color: "var(--pl-on-accent)", border: "none", borderRadius: 10, padding: "12px 34px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Update &amp; save
        </button>
      </div>
    </div>
  );
}

export default function StudioPage() {
  const [tab, setTab] = useState<StudioTab>("overview");
  const [works, setWorks] = useState(MY_WORKS);
  const [showSubmit, setShowSubmit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const unacknowledged = works.find(w => w.status === "declined" && w.ack === false);

  function ackWork() {
    setWorks(prev => prev.map(w => w.ack === false ? { ...w, ack: true } : w));
    setToast("Decision acknowledged.");
    setTimeout(() => setToast(null), 3000);
  }

  function onSubmit(title: string) {
    setShowSubmit(false);
    setToast(`"${title}" submitted for review.`);
    setTimeout(() => setToast(null), 3500);
  }

  const { identity } = galleryConfig;

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden", background: "var(--pl-surface-dark)" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "var(--pl-surface-dark)", borderRight: "1px solid var(--pl-border-dark)", display: "flex", flexDirection: "column", padding: "18px 0 20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "0 18px 20px" }}>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 600, color: "var(--pl-on-dark)" }}>{identity.logoWordmark?.primary ?? identity.shortName}</span>
          {identity.logoWordmark?.secondary && (
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 9, letterSpacing: ".3em", color: "var(--pl-on-dark-soft)" }}>{identity.logoWordmark.secondary}</span>
          )}
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--pl-accent)", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>

        <div style={{ padding: "11px 18px", borderTop: "1px solid var(--pl-border-dark)", borderBottom: "1px solid var(--pl-border-dark)", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarBg(7), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>TH</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pl-on-dark)" }}>Tariq Hendricks</div>
              <div style={{ fontSize: 11, color: "var(--pl-on-dark-faint)" }}>Cape Town</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {STUDIO_NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id as StudioTab)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === item.id ? "rgba(255,255,255,.08)" : "transparent", color: tab === item.id ? "var(--pl-on-dark)" : "var(--pl-on-dark-faint)", fontSize: 14, fontWeight: tab === item.id ? 600 : 400, textAlign: "left" }}>
              {item.label}
              {item.id === "messages" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--pl-accent)", display: "inline-block" }} />}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 10px 0", borderTop: "1px solid var(--pl-border-dark)" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "var(--pl-on-dark-faint)" }}>
            <span>🖼️</span> Gallery dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, background: "var(--pl-bg-app)", color: "var(--pl-text)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 56, borderBottom: "1px solid var(--pl-border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0, background: "var(--pl-bg-app)" }}>
          <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0, flex: 1, textTransform: "capitalize" }}>
            {tab === "open-calls" ? "Open calls" : tab}
          </h1>
          {tab === "submissions" && (
            <button onClick={() => setShowSubmit(true)} style={{ fontSize: 13, padding: "9px 15px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>Submit work</button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
          {tab === "overview" && (
            <div>
              {unacknowledged && <BlockingBanner work={unacknowledged} onAck={ackWork} />}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Submitted", value: works.length },
                  { label: "Approved", value: works.filter(w => w.status === "approved").length },
                  { label: "Pending", value: works.filter(w => w.status === "pending").length },
                  { label: "Open calls", value: OPEN_CALLS.filter(o => o.accepting).length },
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
                      <div style={{ width: 42, height: 52, borderRadius: 5, background: artworkBg(i), flexShrink: 0 }} />
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
                        <div style={{ width: 50, height: 62, borderRadius: 5, background: artworkBg(i), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600 }}>{w.title}</div>
                          <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{w.medium} · {w.year}</div>
                          <div style={{ fontSize: 11.5, color: "var(--pl-text-faint)", marginTop: 3 }}>Submitted {w.date}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg, flexShrink: 0 }}>{meta.label}</span>
                      </div>
                      {w.note && (
                        <div style={{ padding: "12px 17px", borderTop: "1px solid var(--pl-divider)", background: w.status === "declined" && w.ack === false ? "var(--pl-declined-panel-bg)" : "var(--pl-sidebar)" }}>
                          <div style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)", marginBottom: 5 }}>Gallery note</div>
                          <p style={{ fontSize: 13, color: "var(--pl-text-secondary)", lineHeight: 1.6, margin: 0 }}>{w.note}</p>
                          {w.status === "approved" && (
                            <div style={{ marginTop: 11, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--pl-approved-panel-bg)", color: "var(--pl-approved-fg)", padding: "7px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600 }}>
                              📋 Drop-off pass issued · {galleryConfig.business.dropOffPassPrefix}14
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
              {OPEN_CALLS.map((oc) => (
                <div key={oc.title} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" as const }}>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0 }}>{oc.title}</h3>
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
                  {oc.accepting && (
                    <button onClick={() => setShowSubmit(true)} style={{ marginTop: 16, padding: "10px 16px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", border: "none", borderRadius: 9, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>
                      Submit for this call
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "messages" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MESSAGES.map((msg) => (
                <div key={msg.preview} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 13, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--pl-solid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--pl-on-solid)" }}>{galleryConfig.identity.shortName.slice(0, 2).toUpperCase()}</div>
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

          {tab === "profile" && <ProfilePanel />}
        </div>
      </main>

      {showSubmit && <SubmitDrawer onClose={() => setShowSubmit(false)} onSubmit={onSubmit} />}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
