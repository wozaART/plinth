"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Step = "intro" | "branding" | "preview" | "feedback" | "done";

const ACCENT_SWATCHES = [
  "#B5623C", "#8A3A30", "#3C566B", "#4A6138",
  "#6E5A8A", "#A8842C", "#2A6F6B", "#1F1D1A",
];

const INK_OPTIONS = [
  { name: "Charcoal", color: "#17150F" },
  { name: "Navy",     color: "#14213F" },
  { name: "Forest",   color: "#163326" },
  { name: "Aubergine",color: "#301B2E" },
];

const SIDEBAR_OPTIONS = [
  { name: "Warm",  color: "#F4F1EA" },
  { name: "Stone", color: "#EFEDE6" },
  { name: "Mist",  color: "#ECEEEC" },
];

const FONT_OPTIONS = [
  { id: "serif",  label: "Editorial", desc: "Serif headlines",  stack: "'Newsreader',serif",      sample: "'Newsreader',serif" },
  { id: "sans",   label: "Modern",    desc: "Sans headlines",   stack: "'Geist',sans-serif",      sample: "'Geist',sans-serif" },
  { id: "custom", label: "Custom",    desc: "Your own font",    stack: null,                      sample: null },
];

const FONT_SUGGESTIONS = [
  "Playfair Display", "Cormorant Garamond", "Libre Baskerville",
  "Spectral", "Space Grotesk", "DM Serif Display",
];

const FEATURES = [
  { id: "submissions",     label: "Submission review",           desc: "Approve, decline or request changes on every artist submission — with required written feedback.",          dot: "#8A6A1E" },
  { id: "acknowledgement", label: "The acknowledgement workflow", desc: "Artists must open and confirm a decision before delivering — so no work arrives unannounced.",             dot: "#B04A3C" },
  { id: "passes",          label: "Drop-off passes",             desc: "Approved work gets a reference, delivery window and packing notes. The desk is expecting it.",              dot: "#6B8A4E" },
  { id: "exhibitions",     label: "Exhibition planning",         desc: "Open calls, application tracking, slots and hang dates in one programme view.",                             dot: "#5A7894" },
  { id: "catalogue",       label: "Catalogue & inventory",       desc: "Every work with a clear status — available, sold, reserved or on loan.",                                   dot: "#57534A" },
  { id: "collectors",      label: "Collector CRM",               desc: "Remember focus, history and last contact — keep relationships warm between shows.",                        dot: "#6E5A8A" },
  { id: "artist_submit",   label: "Artist submission flow",      desc: "A guided, four-step form so artists submit complete, well-presented work.",                                dot: "#8A6A1E" },
  { id: "open_calls",      label: "Open calls for artists",      desc: "Artists see what you're accepting and apply directly to the right exhibition.",                           dot: "#2A6F6B" },
  { id: "messaging",       label: "Gallery–artist messaging",    desc: "A direct thread for questions, so artists ask before they arrive.",                                        dot: "#3C566B" },
];

const RATING_WORDS = ["", "Not a fit", "Some value", "Promising", "Strong fit", "Exactly what we need"];

/* ─── Shared input style ─── */
const INP = "width:100%;border:1px solid #E0DBCF;border-radius:10px;padding:12px 13px;font-family:inherit;font-size:14px;color:#17150F;background:#fff;box-sizing:border-box";
const LBL = "display:block;font-size:12.5px;font-weight:550;margin-bottom:7px;color:#3A372F";
const BTN_DARK = { display: "inline-flex", alignItems: "center", gap: 9, background: "#17150F", color: "#FBFAF8", border: "none", borderRadius: 11, padding: "13px 22px", fontFamily: "inherit", fontSize: 14.5, fontWeight: 500, cursor: "pointer" } as const;
const BTN_GHOST = { background: "#fff", border: "1px solid #E0DBCF", borderRadius: 11, padding: "13px 20px", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#57534A" } as const;

function loadGoogleFont(family: string) {
  if (typeof document === "undefined" || !family.trim()) return;
  const id = "plfont-" + family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(l);
}

/* ─── Stepper ─── */
function Stepper({ step }: { step: Step }) {
  const steps: [Step, string][] = [["branding", "Brand"], ["preview", "Review"], ["feedback", "Walkthrough"]];
  const idx = steps.findIndex(([s]) => s === step);
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 36, maxWidth: 560 }}>
      {steps.map(([, label], i) => {
        const on = i <= idx;
        return (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 20, background: on ? "#17150F" : "#E4DFD3" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: on ? "#17150F" : "#A39D8E" }}>0{i + 1}</span>
              <span style={{ fontSize: 12.5, color: on ? "#17150F" : "#A39D8E" }}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Live brand preview card (branding step sidebar) ─── */
function BrandPreviewCard({ name, accent, ink, sidebar, fontStack }: {
  name: string; accent: string; ink: string; sidebar: string; fontStack: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 16, overflow: "hidden", boxShadow: "0 14px 40px rgba(40,34,28,.08)" }}>
      <div style={{ background: sidebar, padding: "20px 22px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <>
                <span style={{ fontFamily: fontStack, fontSize: 24, fontWeight: 600, letterSpacing: "-.01em", color: ink }}>
                  {name || "Your Gallery"}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, transform: "translateY(-7px)", display: "inline-block" }} />
              </>
        </div>
        <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#9A9486", marginTop: 6 }}>
          Gallery operations
        </div>
      </div>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <span style={{ fontSize: 11, background: ink, color: "#fff", padding: "5px 12px", borderRadius: 7 }}>Submissions</span>
          <span style={{ fontSize: 11, background: "#F1EEE6", color: "#8B8579", padding: "5px 12px", borderRadius: 7 }}>Catalogue</span>
        </div>
        <div style={{ border: "1px solid #ECE8DE", borderRadius: 11, overflow: "hidden" }}>
          <div style={{ height: 80, background: "radial-gradient(circle at 70% 32%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)", position: "relative" }}>
            <span style={{ position: "absolute", top: 9, left: 9, fontSize: 10, background: accent, color: "#fff", padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>New submission</span>
          </div>
          <div style={{ padding: "13px 14px" }}>
            <div style={{ fontFamily: fontStack, fontSize: 15, fontWeight: 600, color: ink }}>Veld at First Light</div>
            <div style={{ fontSize: 12, color: "#8B8579", marginTop: 2 }}>Thandiwe Mokoena</div>
            <button style={{ marginTop: 13, width: "100%", background: ink, color: "#fff", border: "none", borderRadius: 8, padding: 9, fontFamily: "inherit", fontSize: 12.5, fontWeight: 550, cursor: "default" }}>
              Approve &amp; issue pass
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14, fontSize: 12, color: accent, fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block" }} />
          Your accent, applied everywhere
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard preview (preview step) ─── */
function DashboardPreview({ name, accent, ink, sidebar, fontStack, onOpen }: {
  name: string; accent: string; ink: string; sidebar: string; fontStack: string; onOpen: () => void;
}) {
  return (
    <div style={{ border: "1px solid #ECE8DE", borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 12px 36px rgba(40,34,28,.07)" }}>
      <div style={{ display: "flex", height: 230 }}>
        <div style={{ flex: "0 0 92px", background: sidebar, borderRight: "1px solid rgba(0,0,0,.05)", padding: "14px 10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
            <div style={{ fontFamily: fontStack, fontSize: 14, fontWeight: 600, color: ink, lineHeight: 1.1 }}>{(name || "Gallery").split(" ")[0]}</div>
            <div style={{ height: 7 }} />
            <div style={{ fontSize: 10, background: ink, color: "#fff", padding: "4px 9px", borderRadius: 6, width: "100%" }}>Overview</div>
            {["Submissions", "Exhibitions", "Catalogue"].map(l => (
              <div key={l} style={{ fontSize: 10, color: "#6B655B", padding: "4px 9px" }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: "15px 16px", minWidth: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#A39D8E" }}>Review queue</div>
          <div style={{ fontFamily: fontStack, fontSize: 17, fontWeight: 600, color: ink, margin: "2px 0 11px" }}>Submissions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { bg: "linear-gradient(112deg,#9AA487 0 52%, #7C8869 52%)", label: "Salt Pan" },
              { bg: "linear-gradient(120deg,#34406A 0 60%, #C99A3F 60%)", label: "Red Ground" },
            ].map(card => (
              <div key={card.label} style={{ border: "1px solid #ECE8DE", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: 42, background: card.bg, position: "relative" }}>
                  <span style={{ position: "absolute", top: 5, left: 5, width: 6, height: 6, borderRadius: "50%", background: accent, display: "block" }} />
                </div>
                <div style={{ padding: "6px 7px", fontSize: 9, color: "#6B655B" }}>{card.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 10, background: ink, color: "#fff", display: "inline-block", padding: "6px 11px", borderRadius: 7 }}>+ Review</div>
        </div>
      </div>
      <div style={{ padding: "16px 18px", borderTop: "1px solid #ECE8DE", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: ink }}>Gallery dashboard</div>
          <div style={{ fontSize: 12, color: "#8B8579" }}>Run your whole programme</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/demo/gallery" onClick={onOpen} style={{ background: ink, color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 9, whiteSpace: "nowrap" }}>Open →</a>
      </div>
    </div>
  );
}

/* ─── Studio preview (preview step) ─── */
function StudioPreview({ name, accent, ink, fontStack, onOpen }: {
  name: string; accent: string; ink: string; fontStack: string; onOpen: () => void;
}) {
  return (
    <div style={{ border: "1px solid #ECE8DE", borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 12px 36px rgba(40,34,28,.07)" }}>
      <div style={{ display: "flex", height: 230 }}>
        <div style={{ flex: "0 0 92px", background: ink, padding: "14px 10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
            <div style={{ fontFamily: fontStack, fontSize: 14, fontWeight: 600, color: "#FBFAF8", lineHeight: 1.1 }}>{(name || "Gallery").split(" ")[0]}</div>
            <div style={{ height: 7 }} />
            <div style={{ fontSize: 10, background: "rgba(255,255,255,.12)", color: "#fff", padding: "4px 9px", borderRadius: 6, width: "100%" }}>Home</div>
            {["My work", "Submit", "Messages"].map(l => (
              <div key={l} style={{ fontSize: 10, color: "#B8B2A6", padding: "4px 9px" }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: "15px 16px", minWidth: 0, background: "#FBFAF8" }}>
          <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#A39D8E" }}>Action required</div>
          <div style={{ fontFamily: fontStack, fontSize: 17, fontWeight: 600, color: ink, margin: "2px 0 11px" }}>Needs your response</div>
          <div style={{ background: "#fff", border: "1px solid #ECE8DE", borderLeft: `3px solid ${accent}`, borderRadius: 9, padding: "11px 12px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".04em", color: accent }}>DECISION TO READ</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: ink, marginTop: 3 }}>City Grid · not accepted</div>
            <div style={{ marginTop: 9, fontSize: 10, background: ink, color: "#fff", display: "inline-block", padding: "6px 11px", borderRadius: 7 }}>Read &amp; confirm</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 18px", borderTop: "1px solid #ECE8DE", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: ink }}>Artist studio</div>
          <div style={{ fontSize: 12, color: "#8B8579" }}>Where your artists submit</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/demo/artist" onClick={onOpen} style={{ background: ink, color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 9, whiteSpace: "nowrap" }}>Open →</a>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function ReviewPage() {
  const [step, setStep] = useState<Step>("intro");

  // Brand state
  const [galleryName, setGalleryName] = useState("Your Gallery");
  const [tagline, setTagline] = useState("");
  const [accent, setAccent] = useState("#B5623C");
  const [ink, setInk] = useState("#17150F");
  const [sidebar, setSidebar] = useState("#F4F1EA");
  const [font, setFont] = useState<"serif" | "sans" | "custom">("serif");
  const [customFont, setCustomFont] = useState("");

  // Survey state
  const [featureRatings, setFeatureRatings] = useState<Record<string, string>>({});
  const [featureNotes, setFeatureNotes] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(0);
  const [mostValuable, setMostValuable] = useState("");
  const [missing, setMissing] = useState("");
  const [pain, setPain] = useState("");
  const [adopt, setAdopt] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [copied, setCopied] = useState(false);


  // Derived
  const cf = customFont.trim();
  const customStack = cf ? `'${cf}','Newsreader',serif` : "'Newsreader',serif";
  const fontStack = font === "custom"
    ? customStack
    : (FONT_OPTIONS.find(f => f.id === font)?.stack ?? "'Newsreader',serif");

  useEffect(() => {
    if (font === "custom" && cf) loadGoogleFont(cf);
  }, [font, cf]);

  function go(s: Step) {
    setStep(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function buildSummary() {
    const lines: string[] = [];
    lines.push("WOZA ART — GALLERY REVIEW FEEDBACK");
    lines.push("=".repeat(34));
    lines.push("Gallery:   " + (galleryName || "—"));
    if (reviewerName) lines.push("Reviewer:  " + reviewerName);
    if (reviewerEmail) lines.push("Email:     " + reviewerEmail);
    lines.push("");
    lines.push("FEATURE RATINGS");
    const map: Record<string, string> = { valuable: "★ Valuable", maybe: "~ Maybe", no: "· Not for us" };
    FEATURES.forEach(f => {
      const v = featureRatings[f.id];
      const note = (featureNotes[f.id] || "").trim();
      lines.push("• " + f.label + ": " + (v ? map[v] : "(no answer)"));
      if (note) lines.push("    ↳ " + note);
    });
    lines.push("");
    lines.push("OVERALL");
    lines.push("Fit rating:      " + (rating ? `${rating}/5 (${RATING_WORDS[rating]})` : "—"));
    const mv = FEATURES.find(f => f.id === mostValuable);
    lines.push("Most valuable:   " + (mv ? mv.label : "—"));
    lines.push("Would adopt:     " + (adopt || "—"));
    lines.push("");
    lines.push("What's missing / would change:");
    lines.push("  " + (missing.trim() || "—"));
    lines.push("");
    lines.push("Biggest headache to solve:");
    lines.push("  " + (pain.trim() || "—"));
    return lines.join("\n");
  }

  function copySummary() {
    const text = buildSummary();
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 3000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text: string, done: () => void) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy");
    document.body.removeChild(ta); done();
  }

  // Hand the chosen branding to the demo portals (applied for demo accounts only).
  function saveBrand() {
    const brand = { name: galleryName === "Your Gallery" ? "" : galleryName, accent, ink, sidebar, font, customFont: customFont.trim() };
    document.cookie = `pl_brand=${encodeURIComponent(JSON.stringify(brand))}; path=/; max-age=86400; samesite=lax`;
  }

  const showStepper = step === "branding" || step === "preview" || step === "feedback";

  const sectionLabel: React.CSSProperties = { fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "#A39D8E", fontWeight: 600, marginBottom: 13 };
  const chipBase = (on: boolean, onColor = "#17150F") => ({
    display: "inline-flex", alignItems: "center", gap: 8,
    border: `1.5px solid ${on ? onColor : "#E4DFD3"}`,
    background: on ? onColor : "#fff",
    color: on ? "#FBFAF8" : "#57534A",
    borderRadius: 10, padding: "9px 13px",
    fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer",
  } as const);

  return (
    <div style={{ minHeight: "100svh", background: "#FBFAF8" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(251,250,248,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid #ECE8DE" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px clamp(18px,4vw,32px)", display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 600, letterSpacing: "-.01em" }}>Woza Art</span>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, transform: "translateY(-2px)", display: "inline-block" }} />
          </Link>
          <span style={{ fontSize: 13, color: "#A39D8E", padding: "3px 10px", border: "1px solid #E7E3D9", borderRadius: 20 }}>Gallery preview</span>
          <div style={{ flex: 1 }} />
          <Link href="/" style={{ fontSize: 13, color: "#57534A" }}>← Back to overview</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(18px,5vw,32px) 100px" }}>

        {showStepper && <Stepper step={step} />}

        {/* ── Intro ── */}
        {step === "intro" && (
          <div className="anim-fade">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid #E0DBCF", borderRadius: 30, padding: "6px 13px", fontSize: 12, color: "#6B655B", marginBottom: 26 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B5623C", display: "inline-block" }} />
              A preview prepared for your gallery
            </div>
            <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(34px,5.4vw,58px)", fontWeight: 500, lineHeight: 1.04, letterSpacing: "-.025em", margin: "0", maxWidth: 760 }}>
              See Woza Art as <em style={{ fontStyle: "italic", color: "#6B4A3A" }}>your</em> gallery — then tell us what to change.
            </h1>
            <p style={{ fontSize: "clamp(15px,1.7vw,18px)", color: "#57534A", lineHeight: 1.6, maxWidth: 600, margin: "24px 0 0" }}>
              You've had a look at the working sample. Now make it yours: add your name, colours and type, see both portals adopt your brand, then walk through the features and tell us what's valuable and what's missing. It takes about ten minutes.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, margin: "40px 0 36px", maxWidth: 760 }}>
              {[
                { n: "01", title: "Brand it",   desc: "Your name, colours and type, applied live." },
                { n: "02", title: "Review it",  desc: "Open both portals dressed in your identity." },
                { n: "03", title: "Shape it",   desc: "A short walkthrough survey — your feedback guides what we build." },
              ].map(card => (
                <div key={card.n} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 26, color: "#B5623C" }}>{card.n}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, margin: "10px 0 5px" }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: "#6B655B", lineHeight: 1.55 }}>{card.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => go("branding")} style={BTN_DARK}>
              Start with your branding <span style={{ fontSize: 16, lineHeight: 0 }}>→</span>
            </button>
          </div>
        )}

        {/* ── Branding ── */}
        {step === "branding" && (
          <div className="anim-fade">
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(26px,3.6vw,38px)", fontWeight: 550, letterSpacing: "-.02em", margin: 0 }}>Make it yours</h2>
            <p style={{ fontSize: 15, color: "#6B655B", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 560 }}>
              Everything here updates the preview instantly — and carries through to the live portals when you open them.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(24px,4vw,44px)", marginTop: 34, alignItems: "flex-start" }}>
              {/* Controls */}
              <div style={{ flex: "1 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: 26 }}>

                {/* Identity */}
                <div>
                  <div style={sectionLabel}>Identity</div>
                  <label style={{ ...Object.fromEntries(LBL.split(";").map(s => { const [k, ...v] = s.split(":"); return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":").trim()]; })) }}>Gallery name</label>
                  <input
                    value={galleryName === "Your Gallery" ? "" : galleryName}
                    onChange={e => setGalleryName(e.target.value || "Your Gallery")}
                    placeholder="Your Gallery"
                    style={{ ...Object.fromEntries(INP.split(";").map(s => { const [k, ...v] = s.split(":"); return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":").trim()]; })) }}
                  />
                  <div style={{ height: 14 }} />
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 550, marginBottom: 7, color: "#3A372F" }}>
                    Tagline <span style={{ color: "#A39D8E", fontWeight: 400 }}>optional</span>
                  </label>
                  <input
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="Contemporary art · Cape Town"
                    style={{ width: "100%", border: "1px solid #E0DBCF", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, color: "#17150F", background: "#fff", boxSizing: "border-box" }}
                  />
                </div>

                {/* Accent colour */}
                <div>
                  <div style={sectionLabel}>Accent colour</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    {ACCENT_SWATCHES.map(c => {
                      const on = accent.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          onClick={() => setAccent(c)}
                          title={c}
                          style={{ width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${on ? "#17150F" : "transparent"}`, boxShadow: `0 0 0 2px ${on ? "#FBFAF8" : "transparent"}, 0 0 0 ${on ? "3px" : "1px"} ${on ? "#17150F" : "#E4DFD3"}` }}
                        />
                      );
                    })}
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E0DBCF", borderRadius: 9, padding: "6px 9px", cursor: "pointer", fontSize: 12.5, color: "#57534A" }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, border: "1px solid #D9D4C8", background: accent, display: "inline-block" }} />
                      Custom
                      <input type="color" value={accent} onChange={e => setAccent(e.target.value)} style={{ width: 0, height: 0, opacity: 0, position: "absolute" }} />
                    </label>
                  </div>
                </div>

                {/* Ink & canvas */}
                <div>
                  <div style={sectionLabel}>Ink &amp; canvas</div>
                  <div style={{ fontSize: 12, color: "#8B8579", marginBottom: 8 }}>Dark tone for buttons, headers &amp; the studio sidebar.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                    {INK_OPTIONS.map(opt => {
                      const on = ink.toLowerCase() === opt.color.toLowerCase();
                      return (
                        <button key={opt.color} onClick={() => setInk(opt.color)} style={chipBase(on)}>
                          <span style={{ width: 15, height: 15, borderRadius: 4, background: opt.color, border: "1px solid rgba(0,0,0,.1)", display: "inline-block" }} />
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: "#8B8579", marginBottom: 8 }}>Sidebar tint.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {SIDEBAR_OPTIONS.map(opt => {
                      const on = sidebar.toLowerCase() === opt.color.toLowerCase();
                      return (
                        <button key={opt.color} onClick={() => setSidebar(opt.color)} style={chipBase(on)}>
                          <span style={{ width: 15, height: 15, borderRadius: 4, background: opt.color, border: "1px solid rgba(0,0,0,.1)", display: "inline-block" }} />
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Headline type */}
                <div>
                  <div style={sectionLabel}>Headline type</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {FONT_OPTIONS.map(opt => {
                      const on = font === opt.id;
                      const sampleStack = opt.sample ?? customStack;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setFont(opt.id as "serif" | "sans" | "custom");
                            if (opt.id === "custom" && customFont) loadGoogleFont(customFont);
                          }}
                          style={{ flex: 1, textAlign: "left", border: `1.5px solid ${on ? "#17150F" : "#E4DFD3"}`, background: on ? "#FBF7F2" : "#fff", borderRadius: 12, padding: "14px 15px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <div style={{ fontFamily: sampleStack, fontSize: 30, fontWeight: 600, color: "#17150F", lineHeight: 1 }}>Ag</div>
                          <div style={{ fontSize: 12.5, fontWeight: 550, marginTop: 6 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: "#8B8579" }}>{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  {font === "custom" && (
                    <div style={{ marginTop: 13 }}>
                      <input
                        value={customFont}
                        onChange={e => setCustomFont(e.target.value)}
                        onBlur={e => { const v = e.target.value.trim(); if (v) loadGoogleFont(v); }}
                        placeholder="Google Font name — e.g. Playfair Display"
                        style={{ width: "100%", border: "1px solid #E0DBCF", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, color: "#17150F", background: "#fff", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                        {FONT_SUGGESTIONS.map(name => {
                          const on = customFont.toLowerCase() === name.toLowerCase();
                          return (
                            <button
                              key={name}
                              onClick={() => { setCustomFont(name); loadGoogleFont(name); }}
                              style={{ border: `1px solid ${on ? "#17150F" : "#E4DFD3"}`, background: on ? "#17150F" : "#fff", color: on ? "#FBFAF8" : "#57534A", borderRadius: 20, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#A39D8E", marginTop: 9, lineHeight: 1.5 }}>
                        Any family from Google Fonts works — it loads into the preview and travels to your portals.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky live preview */}
              <div style={{ flex: "1 1 320px", minWidth: 0, position: "sticky", top: 84 }}>
                <div style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "#A39D8E", fontWeight: 600, marginBottom: 13 }}>Live preview</div>
                <BrandPreviewCard
                  name={galleryName}
                  accent={accent}
                  ink={ink}
                  sidebar={sidebar}
                  fontStack={fontStack}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 36, maxWidth: 760 }}>
              <button onClick={() => go("intro")} style={BTN_GHOST}>Back</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => go("preview")} style={BTN_DARK}>See it on the portals →</button>
            </div>
          </div>
        )}

        {/* ── Preview ── */}
        {step === "preview" && (
          <div className="anim-fade">
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(26px,3.6vw,38px)", fontWeight: 550, letterSpacing: "-.02em", margin: 0 }}>
              {galleryName}, dressed in your brand
            </h2>
            <p style={{ fontSize: 15, color: "#6B655B", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 600 }}>
              Here's how both portals look now. Open either as a full, working demo — your branding travels with you.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginTop: 34 }}>
              <DashboardPreview name={galleryName} accent={accent} ink={ink} sidebar={sidebar} fontStack={fontStack} onOpen={saveBrand} />
              <StudioPreview name={galleryName} accent={accent} ink={ink} fontStack={fontStack} onOpen={saveBrand} />
            </div>

            <div style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 13, padding: "16px 18px", marginTop: 22, display: "flex", gap: 11, alignItems: "flex-start", maxWidth: 760 }}>
              <span style={{ fontSize: 15 }}>✦</span>
              <div style={{ fontSize: 13, color: "#6B655B", lineHeight: 1.55 }}>
                Open a portal, click around, then come back to this tab. When you've seen enough, move on to the walkthrough and tell us what works.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 32, maxWidth: 760 }}>
              <button onClick={() => go("branding")} style={BTN_GHOST}>Back to branding</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => go("feedback")} style={BTN_DARK}>Start the walkthrough →</button>
            </div>
          </div>
        )}

        {/* ── Walkthrough / Feedback ── */}
        {step === "feedback" && (
          <div className="anim-fade" style={{ maxWidth: 760 }}>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(26px,3.6vw,38px)", fontWeight: 550, letterSpacing: "-.02em", margin: 0 }}>The walkthrough</h2>
            <p style={{ fontSize: 15, color: "#6B655B", lineHeight: 1.6, margin: "12px 0 0" }}>
              For each feature, tell us how useful it is for your gallery — and add a note if you'd change anything. There are no wrong answers; this shapes what we build next.
            </p>

            {/* Who */}
            <div style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, padding: "20px 22px", marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 550, marginBottom: 7, color: "#3A372F" }}>Your name</label>
                <input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="Curator / owner" style={{ width: "100%", border: "1px solid #E0DBCF", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, color: "#17150F", background: "#fff", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 550, marginBottom: 7, color: "#3A372F" }}>
                  Email <span style={{ color: "#A39D8E", fontWeight: 400 }}>so we can follow up</span>
                </label>
                <input value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)} placeholder="you@gallery.co.za" type="email" style={{ width: "100%", border: "1px solid #E0DBCF", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, color: "#17150F", background: "#fff", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              {FEATURES.map(f => {
                const cur = featureRatings[f.id];
                const optDefs: [string, string][] = [["valuable", "Valuable"], ["maybe", "Maybe"], ["no", "Not for us"]];
                const colMap: Record<string, string> = { valuable: "#6B8A4E", maybe: "#8A6A1E", no: "#B04A3C" };
                return (
                  <div key={f.id} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, padding: "18px 20px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: f.dot, display: "inline-block" }} />
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{f.label}</div>
                        </div>
                        <div style={{ fontSize: 13, color: "#8B8579", lineHeight: 1.55, marginTop: 5 }}>{f.desc}</div>
                      </div>
                      <div style={{ display: "flex", gap: 7, flex: "0 0 auto" }}>
                        {optDefs.map(([val, label]) => {
                          const on = cur === val;
                          const col = colMap[val];
                          return (
                            <button
                              key={val}
                              onClick={() => setFeatureRatings(r => ({ ...r, [f.id]: val }))}
                              style={{ border: `1.5px solid ${on ? col : "#E4DFD3"}`, background: on ? col : "#fff", color: on ? "#fff" : "#8B8579", borderRadius: 9, padding: "8px 13px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 550, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {cur && (
                      <input
                        value={featureNotes[f.id] || ""}
                        onChange={e => setFeatureNotes(n => ({ ...n, [f.id]: e.target.value }))}
                        placeholder="What would make this better? (optional)"
                        style={{ width: "100%", border: "1px solid #E0DBCF", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, color: "#17150F", background: "#fff", boxSizing: "border-box", marginTop: 13 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall */}
            <div style={{ background: "#17150F", color: "#EDE8DE", borderRadius: 16, padding: "clamp(22px,3vw,30px)", marginTop: 26 }}>
              <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, color: "#FBFAF8" }}>Overall</div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, color: "#F3EFE7", marginBottom: 10 }}>How well does Woza Art fit your gallery?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const on = rating >= n; const sel = rating === n;
                    return (
                      <button key={n} onClick={() => setRating(n)} style={{ width: 42, height: 42, borderRadius: 11, border: `1.5px solid ${on ? "#C98A6E" : "#3D382F"}`, background: on ? "#C98A6E" : "transparent", color: on ? "#17150F" : "#A8A192", fontFamily: "var(--font-newsreader, serif)", fontSize: 17, fontWeight: 600, cursor: "pointer", transform: sel ? "translateY(-2px)" : "none" }}>
                        {n}
                      </button>
                    );
                  })}
                  {rating > 0 && <span style={{ alignSelf: "center", fontSize: 12.5, color: "#A8A192", marginLeft: 6 }}>{RATING_WORDS[rating]}</span>}
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <label style={{ fontSize: 13.5, fontWeight: 550, color: "#F3EFE7", display: "block", marginBottom: 9 }}>Which feature is most valuable to you?</label>
                <select value={mostValuable} onChange={e => setMostValuable(e.target.value)} style={{ width: "100%", border: "1px solid #3D382F", background: "#211E18", color: "#F3EFE7", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
                  <option value="">Choose one…</option>
                  {FEATURES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>

              <div style={{ marginTop: 22 }}>
                <label style={{ fontSize: 13.5, fontWeight: 550, color: "#F3EFE7", display: "block", marginBottom: 9 }}>What's missing, or what would you change?</label>
                <textarea value={missing} onChange={e => setMissing(e.target.value)} placeholder="The one thing that would make this a yes for you…" style={{ width: "100%", minHeight: 74, resize: "vertical", border: "1px solid #3D382F", background: "#211E18", color: "#F3EFE7", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, lineHeight: 1.55, boxSizing: "border-box" }} />
              </div>

              <div style={{ marginTop: 18 }}>
                <label style={{ fontSize: 13.5, fontWeight: 550, color: "#F3EFE7", display: "block", marginBottom: 9 }}>What's the biggest headache this could take off your plate?</label>
                <textarea value={pain} onChange={e => setPain(e.target.value)} placeholder="Where does your gallery lose the most time or goodwill today?" style={{ width: "100%", minHeight: 74, resize: "vertical", border: "1px solid #3D382F", background: "#211E18", color: "#F3EFE7", borderRadius: 10, padding: "12px 13px", fontFamily: "inherit", fontSize: 14, lineHeight: 1.55, boxSizing: "border-box" }} />
              </div>

              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, color: "#F3EFE7", marginBottom: 10 }}>Would you use Woza Art for your gallery?</div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  {([["Yes — sign us up", "Yes"], ["Maybe, with changes", "Maybe"], ["Not yet", "No"]] as const).map(([label, val]) => {
                    const on = adopt === val;
                    return (
                      <button key={val} onClick={() => setAdopt(val)} style={{ border: `1.5px solid ${on ? "#C98A6E" : "#3D382F"}`, background: on ? "#C98A6E" : "transparent", color: on ? "#17150F" : "#D9CFBC", borderRadius: 10, padding: "11px 16px", fontFamily: "inherit", fontSize: 13.5, fontWeight: 550, cursor: "pointer" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
              <button onClick={() => go("preview")} style={BTN_GHOST}>Back</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setCopied(false); go("done"); }} style={BTN_DARK}>Submit feedback →</button>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="anim-fade" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", paddingTop: "clamp(10px,4vw,40px)" }}>
            <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#EEF2EA", border: "1px solid #DBE6D2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#4A6138", margin: "0 auto" }}>✓</div>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(28px,4vw,42px)", fontWeight: 550, letterSpacing: "-.02em", margin: "22px 0 0" }}>
              Thank you{reviewerName ? `, ${reviewerName.split(" ")[0]}` : ""}.
            </h2>
            <p style={{ fontSize: 16, color: "#57534A", lineHeight: 1.6, margin: "14px auto 0", maxWidth: 480 }}>
              Your feedback is saved on this device. Copy the summary below and send it back to us — it directly shapes what we build for your gallery.
            </p>

            <div style={{ textAlign: "left", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, marginTop: 30, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderBottom: "1px solid #ECE8DE", background: "#FAF8F3" }}>
                <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#A39D8E", fontWeight: 600 }}>Feedback summary</span>
                <button
                  onClick={copySummary}
                  style={{ border: `1px solid ${copied ? "#6B8A4E" : "#E0DBCF"}`, background: copied ? "#EEF2EA" : "#fff", color: copied ? "#4A6138" : "#57534A", borderRadius: 8, padding: "7px 13px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
                >
                  {copied ? "Copied ✓" : "Copy summary"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: 18, fontFamily: "'Geist',monospace", fontSize: 12.5, lineHeight: 1.7, color: "#3A372F", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {buildSummary()}
              </pre>
            </div>

            <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
              <Link href="/dashboard" style={BTN_DARK}>Revisit the dashboard</Link>
              <button onClick={() => go("branding")} style={BTN_GHOST}>Start over</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
