import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/marketing/SiteNav";
import SiteFooter from "@/components/marketing/SiteFooter";
import { RESEARCH_FORMS } from "@/lib/research-forms";

export const metadata: Metadata = {
  title: "Forms — Woza Art",
  description: "Every Woza Art form in one place: gallery consignment terms and short research forms on ideas we are considering.",
};

const CONSIGNMENT_TERMS_URL = "https://woza.art/consignment-terms";

const CARD = {
  display: "block",
  background: "#fff",
  border: "1px solid #ECE8DE",
  borderRadius: 12,
  padding: "16px 17px",
  color: "#17150F",
} as const;

export default function FormsPage() {
  return (
    <>
      <SiteNav />
      <main style={{ flex: 1, background: "#FBFAF8", color: "#17150F" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(32px,6vw,64px) clamp(20px,5vw,40px) 72px" }}>
          <h1 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(32px,7vw,46px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1, margin: 0 }}>
            Forms
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#57534A", margin: "14px 0 0" }}>
            Every form we run, in one place. Each takes a few minutes and helps shape what Woza Art builds.
          </p>

          <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 24, fontWeight: 500, margin: "40px 0 14px" }}>For galleries</h2>
          <a href={CONSIGNMENT_TERMS_URL} style={CARD}>
            <div style={{ fontSize: 15.5, fontWeight: 550 }}>Consignment terms</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#57534A", marginTop: 4 }}>
              How your gallery handles commission, artist payouts, discounts and VAT.
            </div>
          </a>

          <h2 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 24, fontWeight: 500, margin: "40px 0 6px" }}>Ideas we are testing</h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#57534A", margin: "0 0 14px" }}>
            For artists and gallery teams. Tell us whether each idea is a real problem for you.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {RESEARCH_FORMS.map((f) => (
              <li key={f.slug}>
                <Link href={`/forms/${f.slug}`} style={CARD}>
                  <div style={{ fontSize: 15.5, fontWeight: 550 }}>{f.title}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#57534A", marginTop: 4 }}>{f.summary}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
