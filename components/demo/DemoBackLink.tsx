"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function BackLink() {
  const fromReview = useSearchParams().get("from") === "review";
  return (
    <div style={{ position: "fixed", left: "50%", bottom: 16, transform: "translateX(-50%)", zIndex: 60, display: "flex", alignItems: "center", gap: 12, background: "#17150F", color: "#FBFAF8", fontSize: 13, padding: "8px 8px 8px 16px", borderRadius: 999, boxShadow: "0 6px 20px rgba(0,0,0,.25)" }}>
      <span style={{ opacity: 0.75 }}>Demo · nothing is saved</span>
      <Link href={fromReview ? "/review?step=preview" : "/"} style={{ background: "#FBFAF8", color: "#17150F", fontWeight: 500, padding: "7px 14px", borderRadius: 999 }}>
        ← Back to {fromReview ? "review" : "site"}
      </Link>
    </div>
  );
}

export default function DemoBackLink() {
  return <Suspense fallback={null}><BackLink /></Suspense>;
}
