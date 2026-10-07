import type { Metadata } from "next";
import ConsignmentTermsForm from "@/components/marketing/ConsignmentTermsForm";
import { TERMS_QUESTIONS, TERMS_TEXT_LIMITS, type TermsValues } from "@/lib/consignment-terms";

export const metadata: Metadata = {
  title: "Consignment terms — Plinth",
  description: "A few questions about how your gallery handles commission, artist payouts, discounts and VAT.",
  robots: { index: false, follow: false },
};

// Lets a link pre-fill the "About you" answers, e.g.
// /consignment-terms?contact_name=Thomas&contact_role=Gallery+director
const PREFILLABLE = ["gallery_name", "contact_name", "contact_role"];

export default async function ConsignmentTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const initial: TermsValues = {};
  for (const q of TERMS_QUESTIONS) {
    const value = params[q.id];
    if (PREFILLABLE.includes(q.id) && typeof value === "string") {
      initial[q.id] = value.slice(0, TERMS_TEXT_LIMITS.text);
    }
  }

  return (
    <main style={{ flex: 1, background: "var(--pl-bg-app)", color: "var(--pl-text)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(24px,6vw,56px) 16px 64px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 23, fontWeight: 600, letterSpacing: "-.01em" }}>Plinth</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--pl-accent)", transform: "translateY(-2px)", display: "inline-block" }} />
        </div>

        <h1 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(30px,7vw,42px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1, margin: "clamp(28px,6vw,44px) 0 0" }}>
          How does your gallery pay its artists?
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--pl-text-secondary)", margin: "14px 0 28px" }}>
          Plinth is building a consignment ledger that shows an artist each sale, the commission split and when
          they are paid. Your answers shape how it works. It takes about five minutes, and you can skip anything
          marked optional.
        </p>

        <ConsignmentTermsForm initial={initial} />
      </div>
    </main>
  );
}
