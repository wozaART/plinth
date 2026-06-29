"use client";

import { useState } from "react";
import Link from "next/link";

interface DocSection {
  id: string;
  title: string;
  category: string;
  body: string[];
  steps?: string[];
  tip?: string;
}

const DOCS: DocSection[] = [
  {
    id: "welcome",
    category: "Getting started",
    title: "Getting started with Plinth",
    body: [
      "Plinth is designed to be set up in a single afternoon. This guide walks you through creating your gallery profile, inviting your team, and preparing for your first open call.",
      "You don't need to import everything at once — start with your active exhibitions and submissions, and migrate the rest of your catalogue as you go.",
    ],
    steps: [
      "Create your gallery profile — name, location, logo and brand colour.",
      "Set up at least one exhibition or open call so artists have something to submit to.",
      "Invite your first artist by email — they'll be guided through creating their studio account.",
      "Review their submission and issue your first decision.",
    ],
    tip: "Many galleries find the first week easiest if they run Plinth alongside their existing system, then switch fully once the submission workflow feels natural.",
  },
  {
    id: "open-call",
    category: "Getting started",
    title: "Setting up an open call",
    body: [
      "An open call in Plinth is a named exhibition with an accepting status — artists can see it in their studio and submit directly to it.",
      "You can set custom criteria (medium, dimensions, price range) that are shown to artists before they submit. This reduces unsuitable submissions significantly.",
    ],
    steps: [
      "Go to Exhibitions and press + New exhibition.",
      "Name the exhibition, set dates and write a brief public description.",
      "Toggle the status to Open call — it will become visible in artist studios.",
      "Optionally, add criteria: preferred media, maximum dimensions, price range.",
      "As submissions arrive they appear in your queue, tagged with the exhibition name.",
    ],
    tip: "A specific, generous description attracts better submissions than a vague one. Tell artists what kind of work excites you, not just what you'll technically accept.",
  },
  {
    id: "review",
    category: "Submissions",
    title: "Reviewing a submission",
    body: [
      "Submissions arrive in your queue with a Pending badge. Click any submission to open the review panel — you'll see the artwork, dimensions, price, medium and the artist's statement.",
      "You have three options: approve, request changes, or decline. Approvals and declines require a written note for the artist.",
    ],
    steps: [
      "Open the submission from the queue.",
      "Read the statement and check the details against your exhibition criteria.",
      "Press Make a decision to open the decision panel.",
      "Write a brief, honest note. For approvals: confirm the piece and any special instructions. For declines: explain your reasoning kindly — artists remember this.",
      "Confirm your decision. Approved works receive a drop-off pass automatically.",
    ],
    tip: "Declines take under two minutes to write well. The artist will read this carefully — it reflects on your gallery and builds (or damages) the long-term relationship.",
  },
  {
    id: "acknowledgement",
    category: "Submissions",
    title: "The acknowledgement workflow",
    body: [
      "Plinth's signature workflow ensures that declined artists explicitly read and confirm the decision before delivering work — eliminating the common situation where an artist brings rejected work to a show.",
      "When you decline a submission, the artist sees a blocking notice the next time they open their studio. They cannot proceed until they've read the note and confirmed they will not deliver the work.",
    ],
    steps: [
      "You decline a submission and write a reason.",
      "The artist's studio shows a blocking banner on their next login.",
      "They expand and read the full decision note.",
      "They press 'I understand — I won't deliver this work' to acknowledge.",
      "Your gallery view updates from 'awaiting acknowledgement' to 'acknowledged'.",
    ],
    tip: "You can see which declined works are still awaiting acknowledgement from the submission list — a small '⏳' badge appears, and the top bar shows a count.",
  },
  {
    id: "drop-off",
    category: "Submissions",
    title: "Drop-off passes",
    body: [
      "When you approve a submission, a drop-off pass is issued to the artist automatically. The pass contains the work reference, delivery window, packing notes and any special instructions.",
      "Drop-off passes are the artist's proof that their work is expected — and your desk staff's confirmation that this work is cleared for delivery.",
    ],
    steps: [
      "Approve a submission — the pass is generated immediately.",
      "The artist sees the pass in their studio under the approved submission.",
      "You can customise the delivery window and add packing notes before or after approval.",
      "Your front desk can check passes by reference number (format: PL-S##).",
    ],
  },
  {
    id: "catalogue",
    category: "Catalogue",
    title: "Importing your catalogue",
    body: [
      "Your Plinth catalogue is a living record of every work your gallery holds, has sold, or currently has on loan. It doesn't need to be complete on day one — add works as you review them.",
      "Catalogue entries link to artist profiles, so you can see an artist's full submission and exhibition history alongside their currently listed works.",
    ],
    steps: [
      "Go to Catalogue and press + Add work.",
      "Enter the title, artist, medium, dimensions and price.",
      "Set the status: Available, Sold, Reserved, or On loan.",
      "For approved submissions, press Add to catalogue from the submission panel — the details pre-fill from the submission data.",
    ],
    tip: "If you're importing a large existing catalogue, start with your available works — they're the ones collectors will ask about first.",
  },
  {
    id: "collectors",
    category: "Contacts",
    title: "Managing collector relationships",
    body: [
      "The Contacts section is a lightweight CRM for both artists and collectors. For collectors, you can track their focus areas, past purchases and when you last spoke.",
      "Good collector records mean you can reach the right person when a work arrives that they'd care about — rather than broadcasting to everyone.",
    ],
    steps: [
      "Go to Contacts and press + Add contact.",
      "Set the role to Collector and add their details and area of focus.",
      "After a sale or conversation, update the 'Last contact' field.",
      "Use the focus field to search for collectors likely to be interested in a new arrival.",
    ],
  },
  {
    id: "artist-invite",
    category: "Artists",
    title: "Inviting artists to the studio",
    body: [
      "Artists access their studio via their own account — they never see your gallery management tools. To invite an artist, you send them an invitation email from the Contacts section.",
      "Once they've accepted, they can submit to any of your open calls and will receive all future decisions through their studio.",
    ],
    steps: [
      "Go to Contacts and press + Add contact.",
      "Set the role to Artist and add their name and email.",
      "Press Send invitation — they'll receive an email with a link to create their studio account.",
      "Once they're set up, their submissions will appear in your queue tagged with their name.",
    ],
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(DOCS.map(d => d.category)))];

export default function DocsPage() {
  const [activeCat, setActiveCat] = useState("All");
  const [activeId, setActiveId] = useState<string>("welcome");
  const [search, setSearch] = useState("");

  const filtered = DOCS.filter(d => {
    const matchCat = activeCat === "All" || d.category === activeCat;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.body.some(b => b.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const active = DOCS.find(d => d.id === activeId) ?? DOCS[0];

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden", background: "#FBFAF8" }}>

      {/* Left sidebar */}
      <aside style={{ width: 240, flexShrink: 0, background: "#F4F1EA", borderRight: "1px solid #ECE8DE", display: "flex", flexDirection: "column", padding: "18px 0 20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "0 18px 16px" }}>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 600 }}>Plinth</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#B5623C", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>

        {/* Search */}
        <div style={{ padding: "0 12px 12px" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search docs…"
            style={{ width: "100%", background: "#fff", border: "1px solid #E7E3D9", borderRadius: 9, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: "#17150F", boxSizing: "border-box" }}
          />
        </div>

        {/* Categories */}
        <div style={{ padding: "0 12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid", borderColor: activeCat === cat ? "#17150F" : "#E7E3D9", background: activeCat === cat ? "#17150F" : "transparent", color: activeCat === cat ? "#FBFAF8" : "#6B655B", cursor: "pointer" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Doc list */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }} className="scrl">
          {filtered.length === 0 && (
            <div style={{ fontSize: 12.5, color: "#A39D8E", padding: "20px 8px" }}>No results.</div>
          )}
          {CATEGORIES.filter(c => c !== "All").map(cat => {
            const items = filtered.filter(d => d.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#A39D8E", padding: "4px 8px 6px", fontWeight: 600 }}>{cat}</div>
                {items.map(doc => (
                  <button key={doc.id} onClick={() => setActiveId(doc.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, background: activeId === doc.id ? "#fff" : "transparent", color: activeId === doc.id ? "#17150F" : "#6B655B", fontWeight: activeId === doc.id ? 600 : 400, boxShadow: activeId === doc.id ? "0 1px 3px rgba(0,0,0,.05)" : "none" }}>
                    {doc.title}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "10px 10px 0", borderTop: "1px solid #ECE8DE" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "#6B655B" }}>
            ← Back to dashboard
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "clamp(32px,4vw,56px) clamp(28px,5vw,64px)" }} className="scrl">
        <div style={{ maxWidth: 720 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#A39D8E", marginBottom: 8 }}>{active.category}</div>
          <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(26px,3.6vw,36px)", fontWeight: 550, margin: 0, letterSpacing: "-.02em", lineHeight: 1.1 }}>{active.title}</h1>
          <hr style={{ border: "none", borderTop: "1px solid #ECE8DE", margin: "24px 0" }} />

          {active.body.map((para, i) => (
            <p key={i} style={{ fontSize: 15.5, color: "#3D3930", lineHeight: 1.72, margin: "0 0 18px" }}>{para}</p>
          ))}

          {active.steps && (
            <div style={{ margin: "28px 0" }}>
              <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 20, fontWeight: 550, margin: "0 0 16px", letterSpacing: "-.01em" }}>Steps</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {active.steps.map((step, i) => (
                  <li key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#F4F1EA", border: "1px solid #ECE8DE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-newsreader, serif)", fontSize: 13, fontWeight: 600, color: "#B5623C", marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 14.5, color: "#3D3930", lineHeight: 1.65 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {active.tip && (
            <div style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderLeft: "3px solid #B5623C", borderRadius: "0 10px 10px 0", padding: "14px 18px", margin: "24px 0 0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#B5623C", marginBottom: 6 }}>Tip</div>
              <p style={{ fontSize: 13.5, color: "#6B655B", lineHeight: 1.65, margin: 0 }}>{active.tip}</p>
            </div>
          )}

          {/* Prev / Next */}
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", marginTop: 52, paddingTop: 24, borderTop: "1px solid #ECE8DE", flexWrap: "wrap" }}>
            {(() => {
              const idx = DOCS.findIndex(d => d.id === activeId);
              const prev = idx > 0 ? DOCS[idx - 1] : null;
              const next = idx < DOCS.length - 1 ? DOCS[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button onClick={() => setActiveId(prev.id)} style={{ flex: "1 1 auto", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 11, padding: "14px 18px", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: 11.5, color: "#A39D8E", marginBottom: 4 }}>← Previous</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{prev.title}</div>
                    </button>
                  ) : <div style={{ flex: 1 }} />}
                  {next ? (
                    <button onClick={() => setActiveId(next.id)} style={{ flex: "1 1 auto", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 11, padding: "14px 18px", cursor: "pointer", textAlign: "right" }}>
                      <div style={{ fontSize: 11.5, color: "#A39D8E", marginBottom: 4 }}>Next →</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{next.title}</div>
                    </button>
                  ) : <div style={{ flex: 1 }} />}
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
