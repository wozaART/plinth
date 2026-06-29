"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SubmissionsPanel from "@/components/dashboard/SubmissionsPanel";
import ExhibitionsPanel from "@/components/dashboard/ExhibitionsPanel";
import CataloguePanel from "@/components/dashboard/CataloguePanel";
import ContactsPanel from "@/components/dashboard/ContactsPanel";
import { SUBMISSIONS } from "@/lib/data";

type Tab = "submissions" | "exhibitions" | "catalogue" | "contacts";

const NAV = [
  { id: "submissions", label: "Submissions", count: SUBMISSIONS.filter(s => s.status === "pending").length },
  { id: "exhibitions", label: "Exhibitions", count: null },
  { id: "catalogue", label: "Catalogue", count: null },
  { id: "contacts", label: "Contacts", count: null },
] as const;

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("submissions");
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }
  const pendingCount = SUBMISSIONS.filter(s => s.status === "pending").length;
  const ackCount = SUBMISSIONS.filter(s => s.status === "declined" && s.ack === false).length;

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden", background: "#FBFAF8" }}>

      {/* Sidebar */}
      <aside style={{ width: 228, flexShrink: 0, background: "#F4F1EA", borderRight: "1px solid #ECE8DE", display: "flex", flexDirection: "column", padding: "18px 0 20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "0 18px 20px" }}>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 600 }}>Plinth</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#B5623C", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>

        <div style={{ padding: "11px 18px", borderTop: "1px solid #ECE8DE", borderBottom: "1px solid #ECE8DE", marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#A39D8E" }}>Gallery</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>The Sable Gallery</div>
          <div style={{ fontSize: 11.5, color: "#8B8579", marginTop: 1 }}>Maboneng, Johannesburg</div>
        </div>

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === item.id ? "#fff" : "transparent", color: tab === item.id ? "#17150F" : "#6B655B", fontWeight: tab === item.id ? 600 : 400, fontSize: 14, textAlign: "left", boxShadow: tab === item.id ? "0 1px 4px rgba(0,0,0,.06)" : "none" }}>
              <span>{item.label}</span>
              {item.count !== null && item.count > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, background: tab === item.id ? "#17150F" : "#E7E3D9", color: tab === item.id ? "#FBFAF8" : "#8B8579", padding: "2px 7px", borderRadius: 12 }}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 10px 0", borderTop: "1px solid #ECE8DE" }}>
          <Link href="/studio" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "#6B655B" }}>
            <span style={{ fontSize: 14 }}>🎨</span> Artist studio
          </Link>
          <Link href="/docs" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "#6B655B" }}>
            <span style={{ fontSize: 14 }}>📖</span> Documentation
          </Link>
          <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "#8A3A30", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 14 }}>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 56, borderBottom: "1px solid #ECE8DE", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0, flex: 1, textTransform: "capitalize" }}>{tab}</h1>
          {ackCount > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5, color: "#8A3A30", background: "#FEF3F0", border: "1px solid #F0CBBF", padding: "5px 11px", borderRadius: 20 }}>
              <span>⏳</span> {ackCount} awaiting acknowledgement
            </div>
          )}
          {pendingCount > 0 && tab !== "submissions" && (
            <button onClick={() => setTab("submissions")} style={{ fontSize: 12.5, color: "#C2922F", background: "#F4ECD9", border: "1px solid #E8D8B0", padding: "5px 11px", borderRadius: 20, cursor: "pointer" }}>
              {pendingCount} pending review
            </button>
          )}
        </div>

        {tab === "submissions" && <SubmissionsPanel />}
        {tab === "exhibitions" && <ExhibitionsPanel />}
        {tab === "catalogue" && <CataloguePanel />}
        {tab === "contacts" && <ContactsPanel />}
      </main>
    </div>
  );
}
