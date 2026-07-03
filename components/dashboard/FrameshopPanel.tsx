import { FRAME_STAGE_META } from "@/lib/constants";
import { artworkBg } from "@/lib/utils";
import type { FrameJob } from "@/lib/types";

export default function FrameshopPanel({ data }: { data: FrameJob[] }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }} className="scrl">
      <div style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: "var(--pl-radius-card-lg)", padding: "16px 18px", display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>In-house framing queue</div>
          <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)", marginTop: 2, lineHeight: 1.5 }}>Approved works routed to the frameshop — track each piece from intake to ready-for-hang.</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--pl-border)" }}>
            {["Work", "Frame spec", "Stage", "Due by"].map(h => (
              <th key={h} style={{ textAlign: h === "Due by" ? "right" : "left", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)", padding: "0 12px 10px", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((f, i) => {
            const meta = FRAME_STAGE_META[f.stage];
            return (
              <tr key={f.title + i} style={{ borderBottom: "1px solid var(--pl-divider)" }}>
                <td style={{ padding: "13px 12px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 44, borderRadius: 4, background: artworkBg(i), flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14, fontWeight: 600 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: "var(--pl-text-soft)" }}>{f.artist}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "13px 12px", fontSize: 12.5, color: "var(--pl-text-secondary)", lineHeight: 1.4 }}>{f.spec}</td>
                <td style={{ padding: "13px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--pl-radius-pill)", background: meta.bg, color: meta.fg }}>{meta.label}</span>
                </td>
                <td style={{ padding: "13px 12px", fontSize: 12.5, color: "var(--pl-text-soft)", textAlign: "right" }}>{f.due}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
