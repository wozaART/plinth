"use client";

import { useState } from "react";
import { CATALOGUE } from "@/lib/data";
import { CAT_STATUS_META } from "@/lib/constants";
import { artworkBg } from "@/lib/utils";

const STATUSES = ["available", "sold", "reserved", "on loan"] as const;

export default function CataloguePanel() {
  const [filter, setFilter] = useState<"all" | string>("all");
  const filtered = filter === "all" ? CATALOGUE : CATALOGUE.filter(w => w.status === filter);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid var(--pl-border)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", ...STATUSES] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "var(--pl-text)" : "var(--pl-border-strong)", background: filter === f ? "var(--pl-text)" : "var(--pl-surface)", color: filter === f ? "var(--pl-on-dark)" : "var(--pl-text-muted)", cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
        <button style={{ fontSize: 13, padding: "8px 14px", background: "var(--pl-text)", color: "var(--pl-on-dark)", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Add work</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--pl-border)" }}>
              {["Work", "Artist", "Price", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)", padding: "0 12px 10px", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => {
              const meta = CAT_STATUS_META[w.status];
              return (
                <tr key={w.title + i} style={{ borderBottom: "1px solid var(--pl-divider)" }}>
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 38, height: 46, borderRadius: 4, background: artworkBg(i), flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14.5, fontWeight: 600 }}>{w.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, color: "var(--pl-text-secondary)" }}>{w.artist}</td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, fontWeight: 500 }}>{w.price}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: meta.bg, color: meta.fg, textTransform: "capitalize" }}>{w.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
