"use client";

import { useState } from "react";
import Link from "next/link";
import { artworkBg, avatarBg } from "@/lib/utils";

type StudioTab = "overview" | "submissions" | "open-calls" | "messages";

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

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  pending:  { label: "Pending review",    bg: "#F4ECD9", fg: "#8A6A1E", border: "#E8D8B0" },
  approved: { label: "Approved",          bg: "#E7EFE1", fg: "#4A6138", border: "#C8DEC0" },
  declined: { label: "Not accepted",      bg: "#F3E4E0", fg: "#8A3A30", border: "#E0C0BA" },
  changes:  { label: "Changes requested", bg: "#E6EBEF", fg: "#3C566B", border: "#C8D8E4" },
};

const OPEN_CALLS = [
  { title: "Highveld Light", gallery: "The Sable Gallery", deadline: "15 Jul 2025", focus: "Landscape & memory of the interior", accepting: true },
  { title: "Clay & Country", gallery: "The Sable Gallery", deadline: "Closed", focus: "Ceramics & sculpture from the Karoo", accepting: false },
  { title: "New Ground: Emerging Voices", gallery: "The Sable Gallery", deadline: "1 Aug 2025", focus: "Solo & duo presentations · under-35 artists", accepting: true },
];

const MESSAGES = [
  { from: "The Sable Gallery", time: "2 days ago", preview: "Re: Archive Fragment III — Drop-off details", body: "Hi Tariq, just following up on the framing note — when you're happy with the change, please let us know and we'll issue the drop-off pass. Looking forward to seeing it." },
  { from: "The Sable Gallery", time: "1 week ago", preview: "Rooftop Study — approved & drop-off pass", body: "Your work has been selected for Highveld Light. Please find attached your drop-off pass with reference PL-S14. Delivery window: Tue 8 Jul, 10:00–13:00. No unscheduled deliveries please." },
];

function BlockingBanner({ work, onAck }: { work: MyWork; onAck: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#2A2723", color: "#F3EFE7", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 50, borderRadius: 5, background: artworkBg(0), flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#D99A8E", fontWeight: 600, letterSpacing: ".04em" }}>NEEDS YOUR ATTENTION</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 4 }}>A decision is waiting for {work.title}</div>
          <div style={{ fontSize: 13, color: "#B8B2A6", marginTop: 4, lineHeight: 1.5 }}>{open ? work.note : (work.note?.slice(0, 120) + "…")}</div>
          {!open && <button onClick={() => setOpen(true)} style={{ fontSize: 12, color: "#D9C4B8", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>Read the full message →</button>}
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 20, background: "#F3E4E0", color: "#8A3A30" }}>Not accepted</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #3D382F" }}>
          <p style={{ fontSize: 13, color: "#D9D3C8", lineHeight: 1.65, margin: "0 0 16px" }}>By confirming below you acknowledge this decision. <strong style={{ color: "#FBFAF8" }}>City Grid will not be delivered to the gallery.</strong></p>
          <button onClick={onAck} style={{ background: "#FBFAF8", color: "#17150F", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
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
      <div style={{ flex: 1, background: "rgba(23,21,15,.32)" }} onClick={onClose} />
      <div className="anim-drawer" style={{ width: "min(500px,100%)", background: "#FBFAF8", borderLeft: "1px solid #ECE8DE", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #ECE8DE", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#FBFAF8" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Submit work</div>
            <div style={{ fontSize: 12, color: "#A39D8E", marginTop: 2 }}>Step {step} of 3 · {stepLabels[step - 1]}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #ECE8DE", background: "none", cursor: "pointer", fontSize: 17, color: "#8B8579" }}>×</button>
        </div>

        <div style={{ height: 3, background: "#ECE8DE" }}><div style={{ width: `${(step / 3) * 100}%`, height: "100%", background: "#B5623C", borderRadius: 2 }} /></div>

        <div style={{ padding: 24, flex: 1 }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Title</span>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Work title" style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Medium</span>
                <input value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} placeholder="e.g. Oil on canvas" style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Year</span>
                <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Submitting for</span>
                <select value={form.exhibition} onChange={e => setForm(f => ({ ...f, exhibition: e.target.value }))} style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F", appearance: "none" }}>
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
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Dimensions</span>
                <input value={form.dim} onChange={e => setForm(f => ({ ...f, dim: e.target.value }))} placeholder="e.g. 80 × 60 cm" style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Asking price (excl. commission)</span>
                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. R 18 000" style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F" }} />
              </label>
              <div style={{ fontSize: 12.5, color: "#8B8579", background: "#F4F1EA", borderRadius: 9, padding: "12px 14px", lineHeight: 1.55 }}>
                The gallery commission of 40% will be added on top of your asking price for the final sale price shown to collectors.
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#A39D8E" }}>Artist statement</span>
                <textarea value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))} rows={5} placeholder="Briefly describe the work — your intent, materials, series context. 80–150 words is ideal." style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#17150F", resize: "none" }} />
              </label>
              <div style={{ fontSize: 12.5, color: "#8B8579", lineHeight: 1.55 }}>After submitting, the gallery will review your work and respond with either an approval (including a drop-off pass) or a note explaining their decision.</div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #ECE8DE", display: "flex", gap: 10 }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: "12px", background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#57534A" }}>Back</button>}
          <button onClick={next} style={{ flex: 2, padding: "12px", background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: "pointer" }}>
            {step < 3 ? "Continue →" : "Submit for review"}
          </button>
        </div>
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

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden", background: "#17150F" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "#211E18", borderRight: "1px solid #2C2920", display: "flex", flexDirection: "column", padding: "18px 0 20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "0 18px 20px" }}>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 600, color: "#FBFAF8" }}>Plinth</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#B5623C", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>

        <div style={{ padding: "11px 18px", borderTop: "1px solid #2C2920", borderBottom: "1px solid #2C2920", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarBg(7), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>TH</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#FBFAF8" }}>Tariq Hendricks</div>
              <div style={{ fontSize: 11, color: "#8A8478" }}>Cape Town</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {([
            { id: "overview", label: "Overview" },
            { id: "submissions", label: "My submissions" },
            { id: "open-calls", label: "Open calls" },
            { id: "messages", label: "Messages" },
          ] as const).map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === item.id ? "rgba(255,255,255,.08)" : "transparent", color: tab === item.id ? "#FBFAF8" : "#8A8478", fontSize: 14, fontWeight: tab === item.id ? 600 : 400, textAlign: "left" }}>
              {item.label}
              {item.id === "messages" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#B5623C", display: "inline-block" }} />}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 10px 0", borderTop: "1px solid #2C2920" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "#8A8478" }}>
            <span>🖼️</span> Gallery dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, background: "#FBFAF8", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 56, borderBottom: "1px solid #ECE8DE", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0, background: "#FBFAF8" }}>
          <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0, flex: 1, textTransform: "capitalize" }}>
            {tab === "open-calls" ? "Open calls" : tab}
          </h1>
          {tab === "submissions" && (
            <button onClick={() => setShowSubmit(true)} style={{ fontSize: 13, padding: "9px 15px", background: "#17150F", color: "#FBFAF8", borderRadius: 9, border: "none", cursor: "pointer" }}>Submit work</button>
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
                  <div key={stat.label} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 28, fontFamily: "var(--font-newsreader, serif)", fontWeight: 550, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 6 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 550, margin: 0 }}>Recent work</h2>
                <button onClick={() => setTab("submissions")} style={{ fontSize: 12.5, color: "#B5623C", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {works.slice(0, 3).map((w, i) => {
                  const meta = STATUS_STYLE[w.status];
                  return (
                    <div key={w.id} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "13px 15px", display: "flex", alignItems: "center", gap: 13 }}>
                      <div style={{ width: 42, height: 52, borderRadius: 5, background: artworkBg(i), flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 15, fontWeight: 600 }}>{w.title}</div>
                        <div style={{ fontSize: 12, color: "#8B8579", marginTop: 2 }}>{w.medium} · {w.year}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{meta.label}</span>
                        {w.status === "declined" && w.ack === false && (
                          <div style={{ fontSize: 10, color: "#B04A3C", marginTop: 5, textAlign: "right" }}>⏳ Unread</div>
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
                  const meta = STATUS_STYLE[w.status];
                  return (
                    <div key={w.id} style={{ background: "#fff", border: "1px solid", borderColor: w.status === "declined" && w.ack === false ? "#E0C0BA" : "#ECE8DE", borderRadius: 13, overflow: "hidden" }}>
                      <div style={{ display: "flex", gap: 14, padding: "15px 17px", alignItems: "center" }}>
                        <div style={{ width: 50, height: 62, borderRadius: 5, background: artworkBg(i), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600 }}>{w.title}</div>
                          <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 2 }}>{w.medium} · {w.year}</div>
                          <div style={{ fontSize: 11.5, color: "#C2BBB1", marginTop: 3 }}>Submitted {w.date}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg, flexShrink: 0 }}>{meta.label}</span>
                      </div>
                      {w.note && (
                        <div style={{ padding: "12px 17px", borderTop: "1px solid #F4F1EA", background: w.status === "declined" && w.ack === false ? "#FEF9F7" : "#FAFAF8" }}>
                          <div style={{ fontSize: 11.5, color: "#A39D8E", marginBottom: 5 }}>Gallery note</div>
                          <p style={{ fontSize: 13, color: "#57534A", lineHeight: 1.6, margin: 0 }}>{w.note}</p>
                          {w.status === "approved" && (
                            <div style={{ marginTop: 11, display: "inline-flex", alignItems: "center", gap: 6, background: "#E7EFE1", color: "#4A6138", padding: "7px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600 }}>
                              📋 Drop-off pass issued · PL-S14
                            </div>
                          )}
                          {w.status === "declined" && w.ack === false && (
                            <button onClick={ackWork} style={{ marginTop: 12, background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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
                <div key={oc.title} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" as const }}>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0 }}>{oc.title}</h3>
                      <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 3 }}>{oc.gallery}</div>
                      <div style={{ fontSize: 13.5, color: "#57534A", marginTop: 6 }}>{oc.focus}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {oc.accepting ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#E7EFE1", color: "#4A6138" }}>Accepting</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#EEEAE0", color: "#8B8579" }}>Closed</span>
                      )}
                      <div style={{ fontSize: 12, color: "#A39D8E", marginTop: 6 }}>Deadline: {oc.deadline}</div>
                    </div>
                  </div>
                  {oc.accepting && (
                    <button onClick={() => setShowSubmit(true)} style={{ marginTop: 16, padding: "10px 16px", background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 9, fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>
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
                <div key={msg.preview} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 13, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#17150F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#FBFAF8" }}>SG</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{msg.from}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#C2BBB1" }}>{msg.time}</div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 550, marginBottom: 7 }}>{msg.preview}</div>
                  <p style={{ fontSize: 13, color: "#6B655B", lineHeight: 1.6, margin: 0 }}>{msg.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showSubmit && <SubmitDrawer onClose={() => setShowSubmit(false)} onSubmit={onSubmit} />}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#17150F", color: "#F3EFE7", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
