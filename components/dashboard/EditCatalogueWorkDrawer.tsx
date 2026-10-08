"use client";

import { useState, type CSSProperties } from "react";
import { CAT_STATUSES } from "@/lib/constants";
import type { CatalogueWorkInput } from "@/lib/supabase/actions";
import type { CatalogueWork } from "@/lib/types";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

interface EditCatalogueWorkDrawerProps {
  work: CatalogueWork;
  onClose: () => void;
  onSave: (id: string, input: Partial<CatalogueWorkInput>) => void;
  onDelete: (id: string) => void;
}

export default function EditCatalogueWorkDrawer({ work, onClose, onSave, onDelete }: EditCatalogueWorkDrawerProps) {
  const [title, setTitle] = useState(work.title);
  const [price, setPrice] = useState(work.priceRaw != null ? String(work.priceRaw) : "");
  const [agreedPrice, setAgreedPrice] = useState(work.agreedPriceRaw != null ? String(work.agreedPriceRaw) : "");
  const [commissionRatePct, setCommissionRatePct] = useState(work.commissionRatePct != null ? String(work.commissionRatePct) : "");
  const [consignedDate, setConsignedDate] = useState(work.consignedDateRaw ?? "");
  const [status, setStatus] = useState<CatalogueWorkInput["status"]>(work.status);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ready = title.trim().length > 0;

  function submit() {
    if (!ready) return;
    onSave(work.id, {
      title: title.trim(),
      price: price.trim() ? Number(price.replace(/[^0-9.]/g, "")) : null,
      agreedPrice: agreedPrice.trim() ? Number(agreedPrice.replace(/[^0-9.]/g, "")) : null,
      commissionRatePct: commissionRatePct.trim() ? Number(commissionRatePct) : null,
      consignedDate: consignedDate || null,
      status,
    });
  }

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer scrl" style={{ width: "min(520px,94vw)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--pl-bg-app)", borderBottom: "1px solid var(--pl-border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)" }}>Catalogue · {work.artist}</div>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: "3px 0 0", letterSpacing: "-.015em" }}>Edit work</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text)", flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: "24px 24px 32px", display: "grid", gap: 18 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Title <span style={{ color: "var(--pl-declined-fg)", textTransform: "none", letterSpacing: 0 }}>required</span></span>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Listed price</span>
              <input value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Agreed with artist</span>
              <input value={agreedPrice} onChange={e => setAgreedPrice(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Commission %</span>
              <input value={commissionRatePct} onChange={e => setCommissionRatePct(e.target.value)} placeholder="Gallery default" style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Consigned on</span>
              <input type="date" value={consignedDate} onChange={e => setConsignedDate(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div>
            <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>Status</label>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {CAT_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 550, cursor: "pointer", border: "1px solid", borderColor: status === s ? "var(--pl-solid)" : "var(--pl-border-strong)", background: status === s ? "var(--pl-solid)" : "var(--pl-surface)", color: status === s ? "var(--pl-on-solid)" : "var(--pl-text-muted)", textTransform: "capitalize" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 13, alignItems: "center", marginTop: 6 }}>
            <button
              onClick={submit}
              disabled={!ready}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", background: ready ? "var(--pl-solid)" : "var(--pl-border-strong)", color: ready ? "var(--pl-on-solid)" : "var(--pl-text-faint)" }}
            >
              Save changes
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={() => confirmDelete ? onDelete(work.id) : setConfirmDelete(true)}
              style={{ marginLeft: "auto", background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-declined-fg)", cursor: "pointer" }}
            >
              {confirmDelete ? "Confirm remove?" : "Remove from catalogue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
