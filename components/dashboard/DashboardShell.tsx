"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SubmissionsPanel from "@/components/dashboard/SubmissionsPanel";
import ExhibitionsPanel from "@/components/dashboard/ExhibitionsPanel";
import CataloguePanel from "@/components/dashboard/CataloguePanel";
import ContactsPanel from "@/components/dashboard/ContactsPanel";
import FrameshopPanel from "@/components/dashboard/FrameshopPanel";
import PayoutsPanel from "@/components/dashboard/PayoutsPanel";
import ProfileDropdown from "@/components/shared/ProfileDropdown";
import ProfileSwitcher from "@/components/shared/ProfileSwitcher";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import ActivityLogPanel from "@/components/dashboard/ActivityLogPanel";
import { useGalleryConfig } from "@/lib/gallery-context";
import type { Submission, Exhibition, ExhibitionInvite, CatalogueWork, GalleryArtist, Contact, FrameJob, Payout, AuditLogEntry } from "@/lib/types";

type Tab = "submissions" | "exhibitions" | "catalogue" | "contacts" | "frameshop" | "payouts" | "settings" | "activity";

interface DashboardShellProps {
  submissions: Submission[];
  exhibitions: Exhibition[];
  exhibitionInvites: ExhibitionInvite[];
  catalogue: CatalogueWork[];
  catalogueArtists: GalleryArtist[];
  contacts: Contact[];
  frameJobs: FrameJob[];
  payouts: Payout[];
  auditLog: AuditLogEntry[];
  customDomain: string | null;
  domainStatus: string;
  isArtist: boolean;
  artistName: string;
  artistCity: string;
}

export default function DashboardShell({ submissions, exhibitions, exhibitionInvites, catalogue, catalogueArtists, contacts, frameJobs, payouts, auditLog, customDomain, domainStatus, isArtist, artistName, artistCity }: DashboardShellProps) {
  const [tab, setTab] = useState<Tab>("submissions");
  const router = useRouter();
  const { identity, nav } = useGalleryConfig();

  const pendingCount = submissions.filter(s => s.status === "pending").length;
  const ackCount = submissions.filter(s => s.status === "declined" && s.ack === false).length;

  const PENDING_COUNT_BY_TAB: Partial<Record<Tab, number>> = { submissions: pendingCount };
  const NAV = nav.galleryTabs
    .filter(t => t.enabled)
    .map(t => ({ id: t.id as Tab, label: t.label, count: PENDING_COUNT_BY_TAB[t.id as Tab] ?? null }));

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden", background: "var(--pl-bg-app)", color: "var(--pl-text)" }}>

      {/* Sidebar */}
      <aside style={{ width: 228, flexShrink: 0, background: "var(--pl-sidebar)", borderRight: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", padding: "18px 0 20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "0 18px 20px" }}>
          <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 21, fontWeight: 600 }}>{identity.logoWordmark?.primary ?? identity.shortName}</span>
          {identity.logoWordmark?.secondary && (
            <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 9, letterSpacing: ".3em", color: "var(--pl-text-eyebrow)" }}>{identity.logoWordmark.secondary}</span>
          )}
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--pl-accent)", transform: "translateY(-2px)", display: "inline-block" }} />
        </Link>

        {isArtist ? (
          <ProfileDropdown
            current="gallery"
            tone="light"
            options={[
              { kind: "gallery", name: identity.name, detail: identity.city, href: "/dashboard" },
              { kind: "artist", name: artistName, detail: artistCity || "Artist studio", href: "/studio" },
            ]}
          />
        ) : (
          <div style={{ padding: "11px 18px", borderTop: "1px solid var(--pl-border)", borderBottom: "1px solid var(--pl-border)", marginBottom: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)" }}>Gallery</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{identity.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)", marginTop: 1 }}>{identity.city}</div>
          </div>
        )}

        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === item.id ? "var(--pl-surface)" : "transparent", color: tab === item.id ? "var(--pl-text)" : "var(--pl-text-muted)", fontWeight: tab === item.id ? 600 : 400, fontSize: 14, textAlign: "left", boxShadow: tab === item.id ? "0 1px 4px rgba(0,0,0,.06)" : "none" }}>
              <span>{item.label}</span>
              {item.count !== null && item.count > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, background: tab === item.id ? "var(--pl-accent)" : "var(--pl-border-strong)", color: tab === item.id ? "var(--pl-on-accent)" : "var(--pl-text-soft)", padding: "2px 7px", borderRadius: 12 }}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 10px 0", borderTop: "1px solid var(--pl-border)" }}>
          <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)", padding: "4px 12px 6px" }}>Profile</div>
          <button onClick={() => setTab("settings")} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13, color: tab === "settings" ? "var(--pl-text)" : "var(--pl-text-muted)", background: tab === "settings" ? "var(--pl-surface)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 14 }}>⚙</span> Settings
          </button>
          <button onClick={() => setTab("activity")} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13, color: tab === "activity" ? "var(--pl-text)" : "var(--pl-text-muted)", background: tab === "activity" ? "var(--pl-surface)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 14 }}>🕓</span> Activity log
          </button>
          <Link href="/docs" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "var(--pl-text-muted)" }}>
            <span style={{ fontSize: 14 }}>📖</span> Documentation
          </Link>
          <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13, color: "var(--pl-declined-fg)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 14 }}>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 56, borderBottom: "1px solid var(--pl-border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0, flex: 1, textTransform: "capitalize" }}>{tab}</h1>
          {ackCount > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5, color: "var(--pl-declined-fg)", background: "var(--pl-declined-panel-bg)", border: "1px solid var(--pl-declined-panel-border)", padding: "5px 11px", borderRadius: 20 }}>
              <span>⏳</span> {ackCount} awaiting acknowledgement
            </div>
          )}
          {pendingCount > 0 && tab !== "submissions" && (
            <button onClick={() => setTab("submissions")} style={{ fontSize: 12.5, color: "var(--pl-pending-fg)", background: "var(--pl-pending-bg)", border: "1px solid var(--pl-border-strong)", padding: "5px 11px", borderRadius: 20, cursor: "pointer" }}>
              {pendingCount} pending review
            </button>
          )}
        </div>

        {tab === "submissions" && <SubmissionsPanel initialData={submissions} catalogueSubmissionIds={catalogue.map(w => w.submissionId).filter((id): id is string => id !== null)} />}
        {tab === "exhibitions" && <ExhibitionsPanel data={exhibitions} invites={exhibitionInvites} contacts={contacts} />}
        {tab === "catalogue" && <CataloguePanel data={catalogue} artists={catalogueArtists} />}
        {tab === "contacts" && <ContactsPanel data={contacts} />}
        {tab === "frameshop" && <FrameshopPanel data={frameJobs} />}
        {tab === "payouts" && <PayoutsPanel data={payouts} />}
        {tab === "settings" && (
          <>
            {isArtist && <div style={{ padding: "24px 24px 0" }}><ProfileSwitcher current="gallery" /></div>}
            <SettingsPanel customDomain={customDomain} domainStatus={domainStatus} />
          </>
        )}
        {tab === "activity" && <ActivityLogPanel data={auditLog} />}
      </main>
    </div>
  );
}
