"use client";

import { useState } from "react";
import type { AuditLogEntry, AuditAction } from "@/lib/types";

const ACTION_LABEL: Record<AuditAction, string> = {
  insert: "Created",
  update: "Edited",
  delete: "Deleted",
};

const ACTION_COLOR: Record<AuditAction, { bg: string; fg: string }> = {
  insert: { bg: "var(--pl-changes-bg)", fg: "var(--pl-changes-fg)" },
  update: { bg: "var(--pl-pending-bg)", fg: "var(--pl-pending-fg)" },
  delete: { bg: "var(--pl-declined-panel-bg)", fg: "var(--pl-declined-fg)" },
};

export default function ActivityLogPanel({ data }: { data: AuditLogEntry[] }) {
  const entities = ["All", ...Array.from(new Set(data.map(e => e.entity)))] as const;
  const [filter, setFilter] = useState<string>("All");
  const filtered = filter === "All" ? data : data.filter(e => e.entity === filter);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid var(--pl-border)", flexWrap: "wrap", alignItems: "center" }}>
        {entities.map(e => (
          <button key={e} onClick={() => setFilter(e)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === e ? "var(--pl-solid)" : "var(--pl-border-strong)", background: filter === e ? "var(--pl-solid)" : "var(--pl-surface)", color: filter === e ? "var(--pl-on-solid)" : "var(--pl-text-muted)", cursor: "pointer" }}>
            {e}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 24px" }} className="scrl">
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--pl-text-muted)", padding: "20px 0" }}>No activity recorded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(entry => (
              <div key={entry.id} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 14, background: ACTION_COLOR[entry.action].bg, color: ACTION_COLOR[entry.action].fg, flexShrink: 0 }}>
                  {ACTION_LABEL[entry.action]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{entry.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)", marginTop: 2 }}>{entry.entity}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, color: "var(--pl-text-muted)" }}>{entry.actorEmail}</div>
                  <div style={{ fontSize: 11, color: "var(--pl-text-faint)", marginTop: 1 }}>{entry.when}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
