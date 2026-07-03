import { EX_STATUS_META } from "@/lib/constants";
import type { Exhibition } from "@/lib/types";

export default function ExhibitionsPanel({ data }: { data: Exhibition[] }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: 0 }}>Exhibitions</h2>
        <button style={{ fontSize: 13, padding: "9px 15px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>+ New exhibition</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((ex) => {
          const meta = EX_STATUS_META[ex.status];
          const pct = Math.round((ex.filled / ex.slots) * 100);
          return (
            <div key={ex.title} style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <h3 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 18, fontWeight: 600, margin: 0 }}>{ex.title}</h3>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: meta.bg, color: meta.fg }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 4 }}>{ex.dates}</div>
                  <div style={{ fontSize: 13, color: "var(--pl-text-muted)", marginTop: 4 }}>{ex.blurb}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--pl-text-eyebrow)" }}>Slots filled</div>
                  <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{ex.filled}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--pl-text-eyebrow)" }}>/{ex.slots}</span></div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 5, borderRadius: 20, background: "var(--pl-border-strong)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: ex.status === "open" ? "var(--pl-approved-dot)" : ex.status === "planning" ? "var(--pl-pending-dot)" : ex.status === "hanging" ? "var(--pl-changes-dot)" : "var(--pl-text-faint)", borderRadius: 20 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)" }}>{ex.applicants} applicants</span>
                  <span style={{ fontSize: 11.5, color: "var(--pl-text-eyebrow)" }}>{ex.slots - ex.filled} slots remaining</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
