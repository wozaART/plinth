"use client";

import { useState, useTransition } from "react";
import { connectCustomDomain, refreshDomainStatus, disconnectCustomDomain } from "@/lib/supabase/domain-actions";
import type { DnsRecordInstruction } from "@/lib/vercel/domains";

interface SettingsPanelProps {
  customDomain: string | null;
  domainStatus: string;
}

export default function SettingsPanel({ customDomain, domainStatus }: SettingsPanelProps) {
  const [domain, setDomain] = useState(customDomain ?? "");
  const [status, setStatus] = useState(domainStatus);
  const [dnsRecords, setDnsRecords] = useState<DnsRecordInstruction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConnect(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const records = await connectCustomDomain(formData);
        setDnsRecords(records);
        setStatus("pending");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't connect that domain.");
      }
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      try {
        await refreshDomainStatus();
        setStatus(s => (s === "pending" ? "pending" : s));
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't check domain status.");
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectCustomDomain();
        setDomain("");
        setStatus("none");
        setDnsRecords(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't remove that domain.");
      }
    });
  }

  const STATUS_LABEL: Record<string, string> = {
    none: "Not connected",
    pending: "Pending verification",
    verified: "Connected",
    error: "Error",
  };

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Custom domain</h2>
        <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: 0 }}>
          Point a domain you already own at this portal.
        </p>
      </div>

      {domain && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}>
          <span>{domain}</span>
          <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
      )}

      {!domain && (
        <form
          action={handleConnect}
          style={{ display: "flex", gap: 8, marginBottom: 16 }}
        >
          <input
            name="domain"
            placeholder="gallery.example.com"
            required
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--pl-border-input)", fontSize: 13, background: "var(--pl-surface)", color: "var(--pl-text)" }}
          />
          <button
            type="submit"
            disabled={isPending}
            style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--pl-accent)", color: "var(--pl-on-accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {isPending ? "Connecting…" : "Connect"}
          </button>
        </form>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "var(--pl-declined-fg)", marginBottom: 16 }}>{error}</div>
      )}

      {dnsRecords && status === "pending" && (
        <div style={{ border: "1px solid var(--pl-border)", borderRadius: 10, padding: 14, marginBottom: 16, background: "var(--pl-surface)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Add this DNS record at your registrar</div>
          {dnsRecords.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, fontSize: 12.5, fontFamily: "var(--font-geist-mono, monospace)", padding: "4px 0" }}>
              <span style={{ color: "var(--pl-text-muted)" }}>{r.type}</span>
              <span>{r.name}</span>
              <span style={{ color: "var(--pl-text-muted)" }}>→</span>
              <span>{r.value}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--pl-text-soft)", marginTop: 8 }}>
            DNS changes can take a few hours to propagate. Check back once it&apos;s had time to update.
          </div>
        </div>
      )}

      {domain && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-text)", fontSize: 12.5, cursor: "pointer" }}
          >
            Check status
          </button>
          <button
            onClick={handleDisconnect}
            disabled={isPending}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-declined-fg)", fontSize: 12.5, cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
