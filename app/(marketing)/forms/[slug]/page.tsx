import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ResearchForm from "@/components/marketing/ResearchForm";
import { RESEARCH_FORMS, getResearchForm } from "@/lib/research-forms";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RESEARCH_FORMS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const form = getResearchForm((await params).slug);
  return {
    title: form ? `${form.title} — Woza Art` : "Form — Woza Art",
    description: form?.summary,
    robots: { index: false, follow: false },
  };
}

export default async function ResearchFormPage({ params }: Props) {
  const form = getResearchForm((await params).slug);
  if (!form) notFound();

  return (
    <main style={{ flex: 1, background: "var(--pl-bg-app)", color: "var(--pl-text)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(24px,6vw,56px) 16px 64px" }}>
        <Link href="/forms" style={{ fontSize: 13.5, color: "var(--pl-text-secondary)" }}>← All forms</Link>

        <h1 style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "clamp(30px,7vw,42px)", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1, margin: "clamp(24px,5vw,36px) 0 0" }}>
          {form.title}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--pl-text-secondary)", margin: "14px 0 28px" }}>
          Woza Art is deciding what to build next, and your answers help. It takes about three minutes, and you
          can skip anything marked optional.
        </p>

        <ResearchForm slug={form.slug} />
      </div>
    </main>
  );
}
