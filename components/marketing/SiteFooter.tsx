import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{ background: "#17150F", color: "#C2BBAD" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(48px,6vw,72px) clamp(20px,5vw,40px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 40, justifyContent: "space-between" }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 22, fontWeight: 600, color: "#FBFAF8" }}>Woza Art</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#B5623C", transform: "translateY(-2px)", display: "inline-block" }} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: "14px 0 0", color: "#8A8478" }}>The quiet operating system for small contemporary galleries. Made in South Africa.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 48 }}>
            {[
              { heading: "Product", links: [["Gallery dashboard", "/dashboard"], ["Artist studio", "/studio"], ["How it works", "#workflow"]] as [string, string][] },
              { heading: "Resources", links: [["Documentation", "/docs"], ["Articles", "#resources"], ["Tutorials", "#resources"]] as [string, string][] },
              { heading: "Gallery", links: [["About", "#top"], ["Pricing", "#resources"], ["Contact", "#top"]] as [string, string][] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#6F695D", marginBottom: 13 }}>{heading}</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 9, fontSize: 13.5 }}>
                  {links.map(([label, href]) => (
                    <Link key={label} href={href} style={{ color: "#C2BBAD" }}>{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 44, paddingTop: 22, borderTop: "1px solid #2C2920", display: "flex", flexWrap: "wrap" as const, gap: "10px 20px", justifyContent: "space-between", fontSize: 12, color: "#6F695D" }}>
          <span>© 2025 Woza Art. For contemporary galleries.</span>
          <span>Privacy · Terms · Made in South Africa</span>
        </div>
      </div>
    </footer>
  );
}
