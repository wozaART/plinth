import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — Woza Art",
};

export default function NotFound() {
  return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FBFAF8", padding: "0 clamp(20px,5vw,40px)", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(56px,12vw,120px)", fontWeight: 500, color: "#ECE8DE", lineHeight: 1 }}>404</div>
      <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(22px,3.6vw,34px)", fontWeight: 500, margin: "16px 0 0", letterSpacing: "-.02em" }}>This page doesn&apos;t exist.</h1>
      <p style={{ fontSize: 15, color: "#8B8579", lineHeight: 1.6, margin: "14px 0 0", maxWidth: 420 }}>The page you&apos;re looking for may have moved or never existed. Head back to the gallery.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#17150F", color: "#FBFAF8", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500 }}>
          Back to home
        </Link>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E0DBCF", color: "#17150F", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500 }}>
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
