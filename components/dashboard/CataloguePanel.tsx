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
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid #ECE8DE", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", ...STATUSES] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "#17150F" : "#E7E3D9", background: filter === f ? "#17150F" : "#fff", color: filter === f ? "#FBFAF8" : "#6B655B", cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
        <button style={{ fontSize: 13, padding: "8px 14px", background: "#17150F", color: "#FBFAF8", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Add work</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ECE8DE" }}>
              {["Work", "Artist", "Price", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#A39D8E", padding: "0 12px 10px", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => {
              const meta = CAT_STATUS_META[w.status];
              return (
                <tr key={w.title + i} style={{ borderBottom: "1px solid #F4F1EA" }}>
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 38, height: 46, borderRadius: 4, background: artworkBg(i), flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14.5, fontWeight: 600 }}>{w.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, color: "#57534A" }}>{w.artist}</td>
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
