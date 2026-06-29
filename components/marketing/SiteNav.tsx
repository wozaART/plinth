import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function SiteNav() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(251,250,248,.82)", backdropFilter: "blur(10px)", borderBottom: "1px solid #ECE8DE" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "15px clamp(20px,5vw,40px)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" as const }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: "auto" }}>
          <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 23, fontWeight: 600, letterSpacing: "-.01em" }}>Plinth</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#B5623C", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <a href="#portals" style={{ fontSize: 13.5, color: "#57534A" }}>Product</a>
          <a href="#workflow" style={{ fontSize: 13.5, color: "#57534A" }}>How it works</a>
          <a href="#resources" style={{ fontSize: 13.5, color: "#57534A" }}>Resources</a>
          <Link href="/review" style={{ fontSize: 13.5, color: "#57534A" }}>Personalise</Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!user && (
            <Link href="/signin" style={{ fontSize: 13.5, fontWeight: 500, color: "#17150F", padding: "9px 14px" }}>Sign in</Link>
          )}
          {user && (
            <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 500, background: "#17150F", color: "#FBFAF8", padding: "10px 17px", borderRadius: 9 }}>Open dashboard</Link>
          )}
        </div>
      </div>
    </header>
  );
}
