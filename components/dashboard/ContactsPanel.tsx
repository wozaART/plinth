"use client";

import { useState } from "react";
import { CONTACTS } from "@/lib/data";
import { avatarBg, initials } from "@/lib/utils";

export default function ContactsPanel() {
  const [filter, setFilter] = useState<"All" | "Artist" | "Collector">("All");
  const filtered = filter === "All" ? CONTACTS : CONTACTS.filter(c => c.role === filter);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid #ECE8DE", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["All", "Artist", "Collector"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "#17150F" : "#E7E3D9", background: filter === f ? "#17150F" : "#fff", color: filter === f ? "#FBFAF8" : "#6B655B", cursor: "pointer" }}>
              {f}
            </button>
          ))}
        </div>
        <button style={{ fontSize: 13, padding: "8px 14px", background: "#17150F", color: "#FBFAF8", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Add contact</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 24px" }} className="scrl">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c, i) => (
            <div key={c.email} style={{ background: "#fff", border: "1px solid #ECE8DE", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarBg(i), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{initials(c.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 14, background: c.role === "Artist" ? "#F4F1EA" : "#E6EBEF", color: c.role === "Artist" ? "#6B655B" : "#3C566B", fontWeight: 600 }}>{c.role}</span>
                </div>
                <div style={{ fontSize: 12, color: "#8B8579", marginTop: 2 }}>{c.email}</div>
                <div style={{ fontSize: 11.5, color: "#A39D8E", marginTop: 2 }}>{c.focus}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "#C2BBB1" }}>Last contact</div>
                <div style={{ fontSize: 12.5, color: "#6B655B", marginTop: 1 }}>{c.last}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
