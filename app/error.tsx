"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FBFAF8", padding: "0 clamp(20px,5vw,40px)", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F3E4E0", border: "1px solid #E0C0BA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>!</div>
      <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: "clamp(22px,3.6vw,32px)", fontWeight: 500, margin: 0, letterSpacing: "-.02em" }}>Something went wrong.</h1>
      <p style={{ fontSize: 15, color: "#8B8579", lineHeight: 1.6, margin: "14px 0 0", maxWidth: 380 }}>An unexpected error occurred. Try refreshing the page — if the problem persists, please get in touch.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#17150F", color: "#FBFAF8", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
          Try again
        </button>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E0DBCF", color: "#17150F", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500 }}>
          Back to home
        </a>
      </div>
    </div>
  );
}
