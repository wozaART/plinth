import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/marketing/SiteNav";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "Woza Art — Gallery Management for Contemporary Galleries",
  description: "The quiet operating system for small contemporary galleries — submissions, exhibitions, catalogue and collectors in one place.",
};

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">

      <SiteNav />

      {/* HERO */}
      <section id="top" style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(48px,8vw,96px) clamp(20px,5vw,40px) clamp(40px,6vw,72px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "clamp(40px,6vw,72px)", alignItems: "center" }}>
          <div style={{ flex: "1 1 430px", minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid #E0DBCF", borderRadius: 30, padding: "6px 13px", fontSize: 12, color: "#6B655B", marginBottom: 26 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B5623C", display: "inline-block" }} />
              Built for South African contemporary galleries
            </div>
            <h1 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(40px,6.2vw,68px)", fontWeight: 500, lineHeight: 1.02, letterSpacing: "-.025em", margin: 0 }}>
              Mind the art.<br />
              <span style={{ fontStyle: "italic", color: "#6B4A3A" }}>We&apos;ll mind the rest.</span>
            </h1>
            <p style={{ fontSize: "clamp(15px,1.6vw,18px)", lineHeight: 1.6, color: "#57534A", maxWidth: 520, margin: "26px 0 0" }}>
              Woza Art is the quiet operating system for small galleries — submissions, exhibitions, catalogue and collectors in one place, with artists kept informed at every step. So your curators can do the one thing software can&apos;t: welcome people through the door.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginTop: 34 }}>
              <a href="/demo/gallery" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#17150F", color: "#FBFAF8", padding: "14px 22px", borderRadius: 11, fontSize: 14.5, fontWeight: 500 }}>
                Explore the gallery dashboard <span style={{ fontSize: 16, lineHeight: 0 }}>→</span>
              </a>
              <a href="/demo/artist" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #E0DBCF", color: "#17150F", padding: "14px 22px", borderRadius: 11, fontSize: 14.5, fontWeight: 500 }}>
                See the artist studio
              </a>
            </div>
            <div style={{ fontSize: 12.5, color: "#9A9486", marginTop: 22 }}>Two live demos · no sign-up · explore both sides of the platform</div>
          </div>

          {/* Gallery wall visual */}
          <div style={{ flex: "1 1 380px", minWidth: 0, position: "relative" }}>
            <div style={{ position: "relative", background: "linear-gradient(#F4F1EA,#EFEBE2)", borderRadius: 16, padding: "clamp(28px,4vw,44px) clamp(24px,4vw,40px)", minHeight: 380 }}>
              <div style={{ height: 1, background: "#E0D9CC", position: "absolute", left: 0, right: 0, top: "46%" }} />
              <div style={{ display: "flex", justifyContent: "center", gap: "clamp(14px,2.5vw,26px)", alignItems: "flex-end", position: "relative" }}>
                <div style={{ background: "#fff", padding: 9, borderRadius: 3, boxShadow: "0 14px 34px rgba(40,34,28,.13)", transform: "translateY(-16px)" }}>
                  <div style={{ width: "clamp(84px,11vw,116px)", height: "clamp(108px,14vw,150px)", borderRadius: 1, background: "linear-gradient(#6E7355 0 52%, #E7E1D2 52%)" }} />
                </div>
                <div style={{ background: "#fff", padding: 11, borderRadius: 3, boxShadow: "0 18px 40px rgba(40,34,28,.16)" }}>
                  <div style={{ width: "clamp(96px,12.5vw,132px)", height: "clamp(124px,16vw,168px)", borderRadius: 1, background: "radial-gradient(circle at 70% 32%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)" }} />
                </div>
                <div style={{ background: "#fff", padding: 9, borderRadius: 3, boxShadow: "0 14px 34px rgba(40,34,28,.13)", transform: "translateY(-10px)" }}>
                  <div style={{ width: "clamp(84px,11vw,116px)", height: "clamp(108px,14vw,150px)", borderRadius: 1, background: "linear-gradient(120deg,#34406A 0 60%, #C99A3F 60%)" }} />
                </div>
              </div>
              {/* Floating approval card */}
              <div style={{ position: "absolute", left: "clamp(16px,3vw,28px)", bottom: "clamp(16px,3vw,26px)", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "13px 15px", boxShadow: "0 16px 40px rgba(40,34,28,.18)", display: "flex", alignItems: "center", gap: 12, maxWidth: 280 }}>
                <div style={{ width: 38, height: 46, borderRadius: 4, background: "radial-gradient(circle at 70% 32%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6B8A4E", display: "inline-block" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#4A6138", letterSpacing: ".02em" }}>APPROVED</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 550, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Veld at First Light</div>
                  <div style={{ fontSize: 11.5, color: "#8B8579" }}>Drop-off pass issued · PL-S1</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "clamp(40px,6vw,68px)", paddingTop: 30, borderTop: "1px solid #ECE8DE", display: "flex", flexWrap: "wrap" as const, gap: "8px 40px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12.5, color: "#9A9486" }}>Made with curators in Johannesburg, Cape Town &amp; Makhanda</div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 28, fontFamily: "var(--font-newsreader), serif", fontSize: 15, color: "#B8B2A6", fontStyle: "italic" }}>
            <span>Submissions</span><span>Exhibitions</span><span>Catalogue</span><span>Collectors</span>
          </div>
        </div>
      </section>

      {/* THE BURDEN */}
      <section style={{ background: "#F4F1EA", borderTop: "1px solid #ECE8DE", borderBottom: "1px solid #ECE8DE" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(56px,8vw,88px) clamp(20px,5vw,40px)" }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "#A39D8E" }}>The curator&apos;s day</div>
            <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1, margin: "14px 0 0" }}>Running a gallery is mostly logistics and temperament.</h2>
            <p style={{ fontSize: 16, color: "#57534A", lineHeight: 1.6, margin: "18px 0 0" }}>Between the spreadsheets, the unanswered emails and the artist at the door with work you never approved, the actual gallery — the room, the people, the art — gets the least of your attention. Woza Art takes the three heaviest parts off your plate.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(248px,1fr))", gap: 18, marginTop: 42 }}>
            {[
              { n: "01", title: "The logistics", body: "Submissions, selections, delivery windows, wall space, prices and paperwork — tracked in one place instead of ten." },
              { n: "02", title: "The temperament", body: "Every decision reaches the artist in clear, kind language — and you can see when they've read it. Fewer tense moments at the door." },
              { n: "03", title: "The follow-through", body: "Collectors remembered, catalogue kept current, nothing slipping between an opening and a sale." },
            ].map((item) => (
              <div key={item.n} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, padding: "24px 24px 26px" }}>
                <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 30, color: "#B5623C" }}>{item.n}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: "12px 0 7px" }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: "#6B655B", lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO PORTALS */}
      <section id="portals" style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(20px,5vw,40px)", scrollMarginTop: 80 }}>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 12px" }}>
          <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "#A39D8E" }}>One platform, two doors</div>
          <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1, margin: "14px 0 0" }}>Built for both sides of the relationship.</h2>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 24, marginTop: 48 }}>
          {/* Gallery portal */}
          <div style={{ flex: "1 1 440px", minWidth: 0, background: "#fff", border: "1px solid #ECE8DE", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
            <div style={{ padding: "28px clamp(24px,3vw,34px) 0" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase" as const, color: "#6B655B", background: "#F4F1EA", padding: "5px 11px", borderRadius: 20 }}>For the gallery</div>
              <h3 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 26, fontWeight: 550, margin: "16px 0 6px", letterSpacing: "-.01em" }}>The dashboard</h3>
              <p style={{ fontSize: 14, color: "#6B655B", lineHeight: 1.6, margin: 0 }}>Where you and your team run the programme — review work, plan exhibitions, manage the catalogue and look after collectors.</p>
            </div>
            <div style={{ margin: "24px clamp(24px,3vw,34px) 0", background: "#FBFAF8", border: "1px solid #ECE8DE", borderTopLeftRadius: 11, borderTopRightRadius: 11, borderBottom: "none", padding: "16px 16px 0", overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 7, marginBottom: 13 }}>
                <span style={{ fontSize: 11, background: "#17150F", color: "#fff", padding: "4px 11px", borderRadius: 7 }}>All 8</span>
                <span style={{ fontSize: 11, background: "#fff", border: "1px solid #E7E3D9", color: "#8B8579", padding: "4px 11px", borderRadius: 7 }}>Pending 5</span>
                <span style={{ fontSize: 11, background: "#fff", border: "1px solid #E7E3D9", color: "#8B8579", padding: "4px 11px", borderRadius: 7 }}>Approved 2</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ borderRadius: "8px 8px 0 0", overflow: "hidden", background: "#fff", border: "1px solid #ECE8DE", borderBottom: "none" }}>
                  <div style={{ height: 74, background: "radial-gradient(circle at 70% 32%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)", position: "relative" }}>
                    <span style={{ position: "absolute", top: 7, left: 7, fontSize: 9, background: "#F4ECD9", color: "#8A6A1E", padding: "2px 6px", borderRadius: 10, fontWeight: 600 }}>Pending</span>
                  </div>
                  <div style={{ padding: "8px 9px" }}><div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 12, fontWeight: 600 }}>Veld at First Light</div><div style={{ fontSize: 10, color: "#9A9486", marginTop: 2 }}>Thandiwe Mokoena</div></div>
                </div>
                <div style={{ borderRadius: "8px 8px 0 0", overflow: "hidden", background: "#fff", border: "1px solid #ECE8DE", borderBottom: "none" }}>
                  <div style={{ height: 74, background: "linear-gradient(112deg,#9AA487 0 52%, #7C8869 52%)", position: "relative" }}>
                    <span style={{ position: "absolute", top: 7, left: 7, fontSize: 9, background: "#E7EFE1", color: "#4A6138", padding: "2px 6px", borderRadius: 10, fontWeight: 600 }}>Approved</span>
                  </div>
                  <div style={{ padding: "8px 9px" }}><div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 12, fontWeight: 600 }}>Red Ground</div><div style={{ fontSize: 10, color: "#9A9486", marginTop: 2 }}>Nomvula Zulu</div></div>
                </div>
              </div>
            </div>
            <div style={{ padding: "24px clamp(24px,3vw,34px) 28px", marginTop: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px 18px", marginBottom: 22 }}>
                {[
                  ["Submission review", "Approve, decline, request changes"],
                  ["Exhibition planning", "Open calls, slots, hang dates"],
                  ["Catalogue & inventory", "Available, sold, on loan"],
                  ["Collector CRM", "Relationships, not spreadsheets"],
                ].map(([title, sub]) => (
                  <div key={title} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ color: "#B5623C", fontSize: 14, lineHeight: 1.3 }}>—</span>
                    <div><div style={{ fontSize: 13.5, fontWeight: 550 }}>{title}</div><div style={{ fontSize: 12, color: "#8B8579" }}>{sub}</div></div>
                  </div>
                ))}
              </div>
              <a href="/demo/gallery" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#17150F", color: "#FBFAF8", padding: "12px 19px", borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>
                Open the gallery dashboard <span style={{ fontSize: 15, lineHeight: 0 }}>→</span>
              </a>
            </div>
          </div>

          {/* Artist portal */}
          <div style={{ flex: "1 1 440px", minWidth: 0, background: "#17150F", color: "#F3EFE7", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
            <div style={{ padding: "28px clamp(24px,3vw,34px) 0" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase" as const, color: "#C9C2B4", background: "rgba(255,255,255,.08)", padding: "5px 11px", borderRadius: 20 }}>For the artist</div>
              <h3 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 26, fontWeight: 550, margin: "16px 0 6px", letterSpacing: "-.01em", color: "#FBFAF8" }}>The studio</h3>
              <p style={{ fontSize: 14, color: "#B8B2A6", lineHeight: 1.6, margin: 0 }}>Where the artists you work with submit work, apply to open calls, and — crucially — read and acknowledge every decision before they travel.</p>
            </div>
            <div style={{ margin: "24px clamp(24px,3vw,34px) 0", background: "#211E18", border: "1px solid #322E26", borderRadius: 11, padding: "15px 15px 16px" }}>
              <div style={{ display: "flex", gap: 11, alignItems: "center", background: "#2A2620", borderLeft: "3px solid #B04A3C", borderRadius: 8, padding: "11px 12px" }}>
                <div style={{ width: 34, height: 40, borderRadius: 4, background: "linear-gradient(135deg,#B5623C 0 50%, #2A2723 50%)", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#D99A8E", fontWeight: 600, letterSpacing: ".03em" }}>NEEDS YOUR RESPONSE</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#F3EFE7", marginTop: 2 }}>City Grid · not accepted</div>
                </div>
                <span style={{ fontSize: 11, background: "#F3EFE7", color: "#17150F", padding: "6px 10px", borderRadius: 7, fontWeight: 600, whiteSpace: "nowrap" as const }}>Read &amp; confirm</span>
              </div>
              <div style={{ fontSize: 11, color: "#8A8478", marginTop: 11, lineHeight: 1.5, padding: "0 2px" }}>A decision is waiting — the artist must open it and confirm before anything is delivered.</div>
            </div>
            <div style={{ padding: "24px clamp(24px,3vw,34px) 28px", marginTop: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px 18px", marginBottom: 22 }}>
                {[
                  ["Submit work", "Guided, no guesswork"],
                  ["Apply to open calls", "See what's accepting"],
                  ["Clear decisions", "Drop-off passes & reasons"],
                  ["Message the gallery", "Ask before you arrive"],
                ].map(([title, sub]) => (
                  <div key={title} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ color: "#C98A6E", fontSize: 14, lineHeight: 1.3 }}>—</span>
                    <div><div style={{ fontSize: 13.5, fontWeight: 550, color: "#F3EFE7" }}>{title}</div><div style={{ fontSize: 12, color: "#8A8478" }}>{sub}</div></div>
                  </div>
                ))}
              </div>
              <a href="/demo/artist" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FBFAF8", color: "#17150F", padding: "12px 19px", borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>
                Open the artist studio <span style={{ fontSize: 15, lineHeight: 0 }}>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE WORKFLOW */}
      <section id="workflow" style={{ background: "#2A2723", color: "#EDE8DE", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(20px,5vw,40px)" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "#9A9078" }}>The signature workflow</div>
            <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(28px,4.4vw,46px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.08, margin: "14px 0 0", color: "#FBFAF8" }}>No work arrives unannounced.</h2>
            <p style={{ fontSize: 16, color: "#C2BBAD", lineHeight: 1.65, margin: "18px 0 0" }}>The most common friction in a small gallery: an artist brings work that was never approved, because the rejection email went unread. Woza Art closes that gap — a decision isn&apos;t done until the artist has seen it.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(232px,1fr))", gap: 18, marginTop: 48 }}>
            {[
              { n: "1", title: "A decision with a reason", body: "Declines and change-requests require written feedback — no silent rejections, no guessing." },
              { n: "2", title: "The artist must confirm", body: "A blocking notice greets them on login: read the decision, then confirm 'I won't deliver this work.'" },
              { n: "3", title: "You see it land", body: "The gallery view flips from 'awaiting acknowledgement' to 'acknowledged' — so you know it's been read." },
              { n: "4", title: "Approved work gets a pass", body: "Accepted pieces receive a drop-off pass — reference, delivery window and packing notes. The desk is expecting them." },
            ].map((item) => (
              <div key={item.n} style={{ border: "1px solid #3D382F", borderRadius: 14, padding: 24 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #4D473C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-newsreader), serif", fontSize: 15, color: "#D9CFBC" }}>{item.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "16px 0 7px", color: "#FBFAF8" }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: "#A8A192", lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMIZATION */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(20px,5vw,40px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "clamp(36px,5vw,64px)", alignItems: "center" }}>
          <div style={{ flex: "1 1 380px", minWidth: 0 }}>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "#A39D8E" }}>Your gallery, your way</div>
            <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(26px,3.6vw,40px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.12, margin: "14px 0 0" }}>Made for your gallery — not a template.</h2>
            <p style={{ fontSize: 15.5, color: "#57534A", lineHeight: 1.65, margin: "18px 0 0" }}>Every contemporary gallery has its own taste, its own pace and its own way of working with artists. Woza Art adapts to yours: set your own open-call criteria, your pricing approach, your house language for decisions, and your branding — for galleries of two people or twenty.</p>
          </div>
          <div style={{ flex: "1 1 340px", minWidth: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              ["Your criteria", "Define what each open call accepts."],
              ["Your voice", "Decision templates in your tone."],
              ["Your brand", "Logo and palette artists recognise."],
              ["Your team", "Roles for owners and assistants."],
            ].map(([title, sub]) => (
              <div key={title} style={{ background: "#F4F1EA", border: "1px solid #ECE8DE", borderRadius: 13, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 5, lineHeight: 1.55 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section id="resources" style={{ background: "#F4F1EA", borderTop: "1px solid #ECE8DE", borderBottom: "1px solid #ECE8DE", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(56px,8vw,96px) clamp(20px,5vw,40px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 18, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 42 }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "#A39D8E" }}>Learn the system</div>
              <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1, margin: "14px 0 0" }}>Documentation, articles &amp; tutorials.</h2>
              <p style={{ fontSize: 15, color: "#57534A", lineHeight: 1.6, margin: "14px 0 0" }}>Everything you need to set up your gallery, run your first open call, and bring your artists on board — in plain language.</p>
            </div>
            <Link href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#17150F", color: "#FBFAF8", padding: "12px 19px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap" as const }}>
              Browse all resources <span style={{ fontSize: 15, lineHeight: 0 }}>→</span>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#B5623C", display: "inline-block" }} />
                <span style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#6B655B", fontWeight: 600 }}>Documentation</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {[
                  ["Getting started with Woza Art", "Set up your gallery profile, team and first space.", "welcome"],
                  ["Setting up an open call", "Criteria, deadlines and how submissions arrive.", "open-call"],
                  ["Importing your catalogue", "Bring existing works and pricing into Woza Art.", "catalogue"],
                ].map(([title, sub, hash]) => (
                  <Link key={hash} href={`/docs#${hash}`} style={{ display: "block", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "16px 17px" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>
                    <div style={{ fontSize: 12, color: "#B5623C", marginTop: 11, fontWeight: 500 }}>Read →</div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#5A7894", display: "inline-block" }} />
                <span style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#6B655B", fontWeight: 600 }}>Articles</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {[
                  ["Why artists ignore rejection emails", "And the small change that makes them read.", "6 min"],
                  ["Pricing consignment without the awkwardness", "Conversations every gallery owner dreads.", "8 min"],
                  ["An open call that surfaces the right work", "Framing a call to attract the right artists.", "5 min"],
                ].map(([title, sub, time]) => (
                  <a key={title} href="#resources" style={{ display: "block", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "16px 17px" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>
                    <div style={{ fontSize: 12, color: "#5A7894", marginTop: 11, fontWeight: 500 }}>Read · {time} →</div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#6B8A4E", display: "inline-block" }} />
                <span style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#6B655B", fontWeight: 600 }}>Tutorials</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {[
                  ["Review a submission in 90 seconds", "From queue to decision, start to finish.", "1:30"],
                  ["Issue a drop-off pass", "Make sure approved work arrives ready.", "2:10"],
                  ["Build a collector profile", "Keep relationships warm between shows.", "3:00"],
                ].map(([title, sub, time]) => (
                  <a key={title} href="#resources" style={{ display: "block", background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "16px 17px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#17150F", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>▶</span>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#8B8579", marginTop: 8, lineHeight: 1.5 }}>{sub}</div>
                    <div style={{ fontSize: 12, color: "#6B8A4E", marginTop: 11, fontWeight: 500 }}>Watch · {time} →</div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ marginTop: "clamp(48px,7vw,72px)", maxWidth: 780 }}>
            <h3 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 24, fontWeight: 550, margin: "0 0 18px" }}>Common questions</h3>
            <div style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 14, overflow: "hidden" }}>
              {[
                ["Is my gallery's data mine?", "Entirely. Your artists, works, prices and collector relationships belong to your gallery and can be exported at any time. Woza Art never sells your data or shares it between galleries."],
                ["Can artists see each other's submissions?", "No. Each artist only sees their own work, decisions and messages with your gallery. The full review queue is visible to your team alone."],
                ["Does it work for a two-person gallery?", "That's exactly who it's built for. Woza Art is designed for small contemporary galleries who don't have an operations team — it does that job quietly in the background."],
                ["How do my artists get started?", "You invite them by email. They set up a simple profile, then submit work and apply to your open calls through the artist studio — no training required."],
              ].map(([q, a], i, arr) => (
                <details key={q} style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1EEE6" : undefined }}>
                  <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 20px", fontSize: 15, fontWeight: 550 }}>
                    {q}
                    <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 20, color: "#B5623C" }}>+</span>
                  </summary>
                  <div style={{ padding: "0 20px 18px", fontSize: 13.5, color: "#6B655B", lineHeight: 1.65 }}>{a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PERSONALISE BAND */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(20px,4vw,40px) clamp(20px,5vw,40px)" }}>
        <div style={{ background: "#17150F", color: "#F3EFE7", borderRadius: 18, padding: "clamp(28px,4vw,44px) clamp(24px,4vw,46px)", display: "flex", flexWrap: "wrap" as const, gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "#9A9078" }}>Reviewing Woza Art for your gallery?</div>
            <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(24px,3.4vw,36px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.12, margin: "12px 0 0", color: "#FBFAF8" }}>See it in your own brand, then tell us what to change.</h2>
            <p style={{ fontSize: 14.5, color: "#B8B2A6", lineHeight: 1.6, margin: "12px 0 0" }}>Add your logo and colours, watch both portals adapt, and walk through the features with a short feedback survey.</p>
          </div>
          <Link href="/review" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#FBFAF8", color: "#17150F", padding: "14px 24px", borderRadius: 11, fontSize: 14.5, fontWeight: 500, whiteSpace: "nowrap" as const }}>
            Personalise &amp; review <span style={{ fontSize: 16, lineHeight: 0 }}>→</span>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(48px,7vw,90px) clamp(20px,5vw,40px) clamp(64px,9vw,110px)", textAlign: "center" as const }}>
        <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(30px,5vw,54px)", fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.05, margin: "0 auto", maxWidth: 740 }}>Bring a little calm to your gallery.</h2>
        <p style={{ fontSize: 16, color: "#57534A", lineHeight: 1.6, margin: "20px auto 0", maxWidth: 520 }}>Explore both portals as a live demo. When you&apos;re ready, we&apos;ll help you set up your own gallery in an afternoon.</p>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, justifyContent: "center", marginTop: 34 }}>
          <a href="/demo/gallery" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#17150F", color: "#FBFAF8", padding: "15px 26px", borderRadius: 11, fontSize: 15, fontWeight: 500 }}>
            Explore the gallery dashboard <span style={{ fontSize: 16, lineHeight: 0 }}>→</span>
          </a>
          <a href="/demo/artist" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #E0DBCF", color: "#17150F", padding: "15px 26px", borderRadius: 11, fontSize: 15, fontWeight: 500 }}>
            See the artist studio
          </a>
        </div>
      </section>

      <SiteFooter />

    </div>
  );
}
