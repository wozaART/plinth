"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "intro" | "branding" | "preview" | "feedback" | "done";

const ACCENT_OPTIONS = [
  { label: "Terracotta", value: "#B5623C" },
  { label: "Slate blue", value: "#4A6B8A" },
  { label: "Forest", value: "#4A6B4A" },
  { label: "Aubergine", value: "#6B3A6B" },
  { label: "Ochre", value: "#C2922F" },
  { label: "Charcoal", value: "#444038" },
];

const QUESTIONS = [
  { id: "q1", q: "How clearly does Plinth communicate what it does for a gallery owner?", options: ["Very clearly", "Mostly clearly", "Somewhat unclearly", "Very unclearly"] },
  { id: "q2", q: "Which portal did you find most useful to explore?", options: ["Gallery dashboard", "Artist studio", "Roughly equal", "Neither convinced me"] },
  { id: "q3", q: "How likely are you to want to pilot Plinth for your gallery?", options: ["Very likely", "Somewhat likely", "Unlikely", "Definitely not"] },
  { id: "q4", q: "Which feature interests you most?", options: ["Submission review workflow", "The acknowledgement system", "Exhibition planning", "Catalogue & collector CRM"] },
];

/* ─── Step indicators ─── */
function Steps({ current }: { current: Step }) {
  const steps: Step[] = ["intro", "branding", "preview", "feedback", "done"];
  const labels = ["Welcome", "Your brand", "Preview", "Feedback", "Done"];
  const idx = steps.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, background: i < idx ? "#6B8A4E" : i === idx ? "#17150F" : "#F4F1EA", color: i < idx ? "#fff" : i === idx ? "#FBFAF8" : "#A39D8E", border: i < idx ? "none" : "1px solid #ECE8DE" }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12.5, color: i === idx ? "#17150F" : "#A39D8E", fontWeight: i === idx ? 600 : 400 }}>{labels[i]}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 20, height: 1, background: "#ECE8DE", margin: "0 4px" }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Mock dashboard preview with branding ─── */
function DashboardPreview({ galleryName, accentColor }: { galleryName: string; accentColor: string }) {
  return (
    <div style={{ border: "1px solid #ECE8DE", borderRadius: 14, overflow: "hidden", background: "#FBFAF8", fontSize: 12 }}>
      <div style={{ display: "flex", height: 340 }}>
        {/* Sidebar */}
        <div style={{ width: 140, background: "#F4F1EA", borderRight: "1px solid #ECE8DE", padding: "14px 0 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 12px 12px", borderBottom: "1px solid #ECE8DE" }}>
            <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14, fontWeight: 700 }}>Plinth</div>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, display: "inline-block", marginLeft: 3 }} />
          </div>
          <div style={{ padding: "8px 10px", marginTop: 4, flex: 1 }}>
            {["Submissions", "Exhibitions", "Catalogue", "Contacts"].map((item, i) => (
              <div key={item} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 2, background: i === 0 ? "#fff" : "transparent", fontSize: 11.5, color: i === 0 ? "#17150F" : "#6B655B", fontWeight: i === 0 ? 600 : 400, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {item}
                {i === 0 && <span style={{ fontSize: 9, background: accentColor, color: "#fff", padding: "1px 5px", borderRadius: 10 }}>5</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 10px", borderTop: "1px solid #ECE8DE", fontSize: 10.5, color: "#8B8579" }}>
            {galleryName || "Your Gallery"}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #ECE8DE", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 13.5, fontWeight: 600, flex: 1 }}>Submissions</span>
            <span style={{ fontSize: 9, background: "#F4ECD9", color: "#8A6A1E", padding: "2px 7px", borderRadius: 12, fontWeight: 600 }}>5 pending</span>
          </div>
          <div style={{ padding: 10, flex: 1, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { title: "Veld at First Light", artist: "T. Mokoena", status: "pending", bg: "radial-gradient(circle at 70% 32%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)" },
                { title: "Red Ground", artist: "N. Zulu", status: "approved", bg: "linear-gradient(112deg,#9AA487 0 52%, #7C8869 52%)" },
                { title: "Salt Pan, Evening", artist: "L. Khumalo", status: "pending", bg: "linear-gradient(120deg,#E4DCC8 0 46%, #7C7052 46%)" },
                { title: "City After Rain", artist: "T. Hendricks", status: "declined", bg: "linear-gradient(135deg,#4A5560 0 50%, #E0D8CC 50%)" },
              ].map(item => (
                <div key={item.title} style={{ borderRadius: 7, overflow: "hidden", border: "1px solid #ECE8DE", background: "#fff" }}>
                  <div style={{ height: 52, background: item.bg, position: "relative" }}>
                    <span style={{ position: "absolute", top: 4, left: 4, fontSize: 7.5, fontWeight: 700, padding: "2px 5px", borderRadius: 8,
                      background: item.status === "approved" ? "#E7EFE1" : item.status === "declined" ? "#F3E4E0" : "#F4ECD9",
                      color: item.status === "approved" ? "#4A6138" : item.status === "declined" ? "#8A3A30" : "#8A6A1E" }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ padding: "5px 6px" }}>
                    <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 9.5, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: 8.5, color: "#9A9486" }}>{item.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mock studio preview ─── */
function StudioPreview({ accentColor }: { accentColor: string }) {
  return (
    <div style={{ border: "1px solid #3D382F", borderRadius: 14, overflow: "hidden", background: "#1E1B16", fontSize: 12 }}>
      <div style={{ display: "flex", height: 300 }}>
        <div style={{ width: 130, background: "#2A2620", borderRight: "1px solid #2C2920", padding: "14px 0 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 12px 12px", borderBottom: "1px solid #2C2920" }}>
            <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14, fontWeight: 700, color: "#FBFAF8" }}>Plinth</div>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, display: "inline-block", marginLeft: 3 }} />
          </div>
          <div style={{ padding: "8px 10px", flex: 1 }}>
            {["Overview", "My submissions", "Open calls", "Messages"].map((item, i) => (
              <div key={item} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 2, background: i === 0 ? "rgba(255,255,255,.08)" : "transparent", fontSize: 11, color: i === 0 ? "#FBFAF8" : "#8A8478", fontWeight: i === 0 ? 600 : 400 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, background: "#FBFAF8", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #ECE8DE", display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 13, fontWeight: 600, flex: 1 }}>Overview</span>
          </div>
          <div style={{ padding: 10, flex: 1 }}>
            <div style={{ background: "#2A2723", color: "#F3EFE7", borderRadius: 9, padding: "11px 12px", marginBottom: 10, fontSize: 10.5 }}>
              <div style={{ fontSize: 8.5, color: "#D99A8E", fontWeight: 700, marginBottom: 3 }}>NEEDS YOUR ATTENTION</div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>A decision is waiting for City Grid</div>
              <div style={{ color: "#B8B2A6", lineHeight: 1.4 }}>The work is accomplished, but falls outside this exhibition's remit…</div>
              <button style={{ marginTop: 8, fontSize: 9.5, background: "#FBFAF8", color: "#17150F", border: "none", borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontWeight: 600 }}>Read &amp; confirm</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[["4", "Submitted"], ["1", "Approved"], ["1", "Pending"], ["2", "Open calls"]].map(([n, l]) => (
                <div key={l} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 7, padding: "8px 10px" }}>
                  <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 17, fontWeight: 550 }}>{n}</div>
                  <div style={{ fontSize: 9.5, color: "#8B8579", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function ReviewPage() {
  const [step, setStep] = useState<Step>("intro");
  const [galleryName, setGalleryName] = useState("");
  const [accent, setAccent] = useState("#B5623C");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [contact, setContact] = useState("");
  const [previewTab, setPreviewTab] = useState<"dashboard" | "studio">("dashboard");

  const allAnswered = QUESTIONS.every(q => answers[q.id]);

  return (
    <div style={{ minHeight: "100svh", background: "#FBFAF8", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #ECE8DE", background: "rgba(251,250,248,.9)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px clamp(18px,4vw,36px)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, marginRight: "auto" }}>
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 20, fontWeight: 600 }}>Plinth</span>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, transform: "translateY(-2px)", display: "inline-block" }} />
          </Link>
          {step !== "intro" && step !== "done" && <Steps current={step} />}
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 840, margin: "0 auto", width: "100%", padding: "clamp(32px,5vw,56px) clamp(18px,4vw,36px)" }}>

        {/* ─── Intro ─── */}
        {step === "intro" && (
          <div className="anim-fade" style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#A39D8E", marginBottom: 14 }}>Gallery review</div>
            <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(30px,5vw,50px)", fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.05, margin: "0 0 22px" }}>See Plinth in your own brand.</h1>
            <p style={{ fontSize: 16, color: "#57534A", lineHeight: 1.65, margin: "0 0 18px" }}>This short walkthrough lets you add your gallery's name and colour, then see how both portals look with your branding applied. At the end, a five-question survey helps us understand what would make Plinth right for your gallery.</p>
            <p style={{ fontSize: 15, color: "#8B8579", lineHeight: 1.6, margin: "0 0 36px" }}>Takes about five minutes. No sign-up, no obligation.</p>
            <button onClick={() => setStep("branding")} style={{ background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 11, padding: "15px 26px", fontSize: 15.5, fontWeight: 550, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9 }}>
              Start personalising <span style={{ fontSize: 17 }}>→</span>
            </button>
          </div>
        )}

        {/* ─── Branding ─── */}
        {step === "branding" && (
          <div className="anim-fade">
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(24px,4vw,36px)", fontWeight: 550, margin: "0 0 8px", letterSpacing: "-.02em" }}>Your gallery</h2>
            <p style={{ fontSize: 15, color: "#6B655B", lineHeight: 1.6, margin: "0 0 36px" }}>Add your name and choose a signature colour — the preview will update to match.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div>
                <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", color: "#A39D8E", display: "block", marginBottom: 8 }}>Gallery name</label>
                <input
                  value={galleryName}
                  onChange={e => setGalleryName(e.target.value)}
                  placeholder="e.g. The Sable Gallery"
                  style={{ width: "100%", maxWidth: 420, background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 11, padding: "13px 15px", fontSize: 16, fontFamily: "inherit", color: "#17150F", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", color: "#A39D8E", display: "block", marginBottom: 12 }}>Signature colour</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {ACCENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAccent(opt.value)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 24, border: "2px solid", borderColor: accent === opt.value ? opt.value : "#E7E3D9", background: accent === opt.value ? `${opt.value}18` : "#fff", cursor: "pointer", fontSize: 13 }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: opt.value, display: "inline-block" }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview strip */}
              <div style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 13, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600 }}>
                  {galleryName || "Your Gallery"}
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block", marginLeft: 7, transform: "translateY(-2px)" }} />
                </div>
                <div style={{ fontSize: 13, color: "#6B655B", flex: 1, lineHeight: 1.5 }}>This is how your gallery name will appear in the navigation bar and throughout both portals.</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ padding: "8px 16px", background: accent, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 550 }}>Primary button</span>
                  <span style={{ padding: "8px 16px", background: `${accent}18`, color: accent, borderRadius: 8, fontSize: 13, fontWeight: 550, border: `1px solid ${accent}40` }}>Secondary</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
              <button onClick={() => setStep("intro")} style={{ flex: 1, maxWidth: 120, padding: "13px", background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#57534A" }}>Back</button>
              <button onClick={() => setStep("preview")} style={{ flex: 2, maxWidth: 240, padding: "13px", background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: "pointer" }}>
                See the preview →
              </button>
            </div>
          </div>
        )}

        {/* ─── Preview ─── */}
        {step === "preview" && (
          <div className="anim-fade">
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(22px,3.6vw,32px)", fontWeight: 550, margin: "0 0 6px", letterSpacing: "-.02em" }}>
              {galleryName || "Your Gallery"} on Plinth
            </h2>
            <p style={{ fontSize: 15, color: "#6B655B", margin: "0 0 24px" }}>Here's how both portals look with your branding applied. Explore the tabs below.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <button onClick={() => setPreviewTab("dashboard")} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 20, border: "1px solid", borderColor: previewTab === "dashboard" ? "#17150F" : "#E7E3D9", background: previewTab === "dashboard" ? "#17150F" : "#fff", color: previewTab === "dashboard" ? "#FBFAF8" : "#6B655B", cursor: "pointer" }}>Gallery dashboard</button>
              <button onClick={() => setPreviewTab("studio")} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 20, border: "1px solid", borderColor: previewTab === "studio" ? "#17150F" : "#E7E3D9", background: previewTab === "studio" ? "#17150F" : "#fff", color: previewTab === "studio" ? "#FBFAF8" : "#6B655B", cursor: "pointer" }}>Artist studio</button>
            </div>

            {previewTab === "dashboard" && <DashboardPreview galleryName={galleryName} accentColor={accent} />}
            {previewTab === "studio" && <StudioPreview accentColor={accent} />}

            <div style={{ marginTop: 16, fontSize: 13, color: "#A39D8E" }}>
              Want to explore the full interactive demos? <Link href="/dashboard" style={{ color: "#B5623C", fontWeight: 550 }}>Gallery dashboard →</Link> · <Link href="/studio" style={{ color: "#B5623C", fontWeight: 550 }}>Artist studio →</Link>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button onClick={() => setStep("branding")} style={{ flex: 1, maxWidth: 120, padding: "13px", background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#57534A" }}>Back</button>
              <button onClick={() => setStep("feedback")} style={{ flex: 2, maxWidth: 240, padding: "13px", background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: "pointer" }}>
                Continue to feedback →
              </button>
            </div>
          </div>
        )}

        {/* ─── Feedback ─── */}
        {step === "feedback" && (
          <div className="anim-fade">
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(22px,3.6vw,32px)", fontWeight: 550, margin: "0 0 6px", letterSpacing: "-.02em" }}>Quick feedback</h2>
            <p style={{ fontSize: 15, color: "#6B655B", margin: "0 0 32px" }}>Five questions. Your answers help us build a platform that works for galleries like yours.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {QUESTIONS.map((q, qi) => (
                <div key={q.id}>
                  <div style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", lineHeight: 1.4 }}>{qi + 1}. {q.q}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 9, border: "1px solid", borderColor: answers[q.id] === opt ? "#17150F" : "#E7E3D9", background: answers[q.id] === opt ? "#17150F" : "#fff", color: answers[q.id] === opt ? "#FBFAF8" : "#3D3930", cursor: "pointer", textAlign: "left", fontSize: 14 }}
                      >
                        <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid", borderColor: answers[q.id] === opt ? "#FBFAF8" : "#C8C4BC", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {answers[q.id] === opt && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FBFAF8", display: "block" }} />}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label style={{ fontSize: 15, fontWeight: 600, display: "block", marginBottom: 10 }}>5. Anything specific Plinth would need to do or change for you to consider it? <span style={{ fontWeight: 400, color: "#A39D8E" }}>(optional)</span></label>
                <textarea
                  value={extra}
                  onChange={e => setExtra(e.target.value)}
                  rows={3}
                  placeholder="e.g. We need multiple user roles, or we consign to other galleries and would need that tracked…"
                  style={{ width: "100%", background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", color: "#17150F", resize: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 15, fontWeight: 600, display: "block", marginBottom: 4 }}>Email <span style={{ fontWeight: 400, color: "#A39D8E" }}>(optional — if you'd like us to follow up)</span></label>
                <input
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  type="email"
                  placeholder="you@yourgallery.co.za"
                  style={{ width: "100%", maxWidth: 360, background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", color: "#17150F", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
              <button onClick={() => setStep("preview")} style={{ flex: 1, maxWidth: 120, padding: "13px", background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#57534A" }}>Back</button>
              <button
                onClick={() => setStep("done")}
                disabled={!allAnswered}
                style={{ flex: 2, maxWidth: 240, padding: "13px", background: allAnswered ? "#17150F" : "#E7E3D9", color: allAnswered ? "#FBFAF8" : "#A39D8E", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 550, cursor: allAnswered ? "pointer" : "not-allowed" }}
              >
                Submit feedback
              </button>
            </div>
            {!allAnswered && <div style={{ fontSize: 12.5, color: "#A39D8E", marginTop: 10 }}>Please answer all four questions before submitting.</div>}
          </div>
        )}

        {/* ─── Done ─── */}
        {step === "done" && (
          <div className="anim-fade" style={{ maxWidth: 560, textAlign: "center", margin: "0 auto" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#E7EFE1", border: "1px solid #C8DEC0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 24px" }}>✓</div>
            <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(28px,4.4vw,44px)", fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.05, margin: "0 0 18px" }}>Thank you.</h1>
            <p style={{ fontSize: 16, color: "#57534A", lineHeight: 1.65, margin: "0 auto 14px", maxWidth: 440 }}>Your feedback goes directly to the people building Plinth. We read every response and use them to decide what to build next.</p>
            {contact && <p style={{ fontSize: 14, color: "#8B8579", margin: "0 0 36px" }}>We'll follow up at {contact} if there's anything useful to share.</p>}
            {!contact && <div style={{ height: 20 }} />}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#17150F", color: "#FBFAF8", padding: "13px 22px", borderRadius: 11, fontSize: 14.5, fontWeight: 500 }}>
                Explore the gallery dashboard →
              </Link>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E0DBCF", color: "#17150F", padding: "13px 22px", borderRadius: 11, fontSize: 14.5, fontWeight: 500 }}>
                Back to home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
