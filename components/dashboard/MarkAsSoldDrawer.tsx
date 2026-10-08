"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { formatCurrency } from "@/lib/currency";
import { useGalleryConfig } from "@/lib/gallery-context";
import type { RecordSaleInput } from "@/lib/supabase/actions";
import type { CatalogueWork } from "@/lib/types";

const inputStyle: CSSProperties = { background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", borderRadius: 9, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "var(--pl-text)", width: "100%" };
const labelStyle: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" };

function toCents(amount: string): number {
  const n = Number(amount.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

interface MarkAsSoldDrawerProps {
  work: CatalogueWork;
  onClose: () => void;
  onConfirm: (input: RecordSaleInput) => void;
}

export default function MarkAsSoldDrawer({ work, onClose, onConfirm }: MarkAsSoldDrawerProps) {
  const { business } = useGalleryConfig();
  const defaultPrice = work.agreedPriceRaw ?? work.priceRaw;
  const defaultRatePct = work.commissionRatePct ?? Math.round(business.commissionRate * 100);

  const [salePrice, setSalePrice] = useState(defaultPrice != null ? String(defaultPrice) : "");
  const [discount, setDiscount] = useState("");
  const [commissionRatePct, setCommissionRatePct] = useState(String(defaultRatePct));
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [soldDate, setSoldDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [buyerPaidDate, setBuyerPaidDate] = useState("");
  const [payoutDueDate, setPayoutDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const split = useMemo(() => {
    const priceCents = toCents(salePrice);
    const discountCents = Math.min(toCents(discount), priceCents);
    const rate = Number(commissionRatePct) || 0;
    const netCents = priceCents - discountCents;
    const commissionCents = Math.round(netCents * (rate / 100));
    const artistCents = netCents - commissionCents;
    return { priceCents, discountCents, netCents, commissionCents, artistCents };
  }, [salePrice, discount, commissionRatePct]);

  const fmt = (cents: number) => formatCurrency(cents / 100, business.currencyCode);
  const ready = split.priceCents > 0 && commissionRatePct.trim().length > 0 && !submitting;

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    try {
      await onConfirm({
        catalogueWorkId: work.id,
        salePriceCents: split.priceCents,
        discountCents: split.discountCents,
        commissionRatePct: Number(commissionRatePct),
        buyerName: buyerName.trim() || null,
        buyerEmail: buyerEmail.trim() || null,
        buyerPhone: buyerPhone.trim() || null,
        soldDate,
        buyerPaidDate: buyerPaidDate || null,
        payoutDueDate: payoutDueDate || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer scrl" style={{ width: "min(520px,94vw)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--pl-bg-app)", borderBottom: "1px solid var(--pl-border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--pl-text-eyebrow)" }}>Catalogue · {work.artist}</div>
            <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 22, fontWeight: 550, margin: "3px 0 0", letterSpacing: "-.015em" }}>Mark &ldquo;{work.title}&rdquo; as sold</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text)", flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: "24px 24px 32px", display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Sale price <span style={{ color: "var(--pl-declined-fg)", textTransform: "none", letterSpacing: 0 }}>required</span></span>
              <input value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="e.g. 18000" style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Discount</span>
              <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={inputStyle} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Commission %</span>
              <input value={commissionRatePct} onChange={e => setCommissionRatePct(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Sold on</span>
              <input type="date" value={soldDate} onChange={e => setSoldDate(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--pl-sidebar)", border: "1px solid var(--pl-border)", display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--pl-text-secondary)" }}>
              <span>Net of discount</span><span>{fmt(split.netCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--pl-text-secondary)" }}>
              <span>Gallery commission</span><span>{fmt(split.commissionCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5, fontWeight: 600, borderTop: "1px solid var(--pl-divider)", paddingTop: 8 }}>
              <span>Artist receives</span><span>{fmt(split.artistCents)}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Buyer name</span>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Buyer phone</span>
              <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Buyer email</span>
            <input value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} style={inputStyle} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Buyer paid on</span>
              <input type="date" value={buyerPaidDate} onChange={e => setBuyerPaidDate(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Payout due</span>
              <input type="date" value={payoutDueDate} onChange={e => setPayoutDueDate(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: "flex", gap: 13, alignItems: "center", marginTop: 6 }}>
            <button
              onClick={submit}
              disabled={!ready}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", background: ready ? "var(--pl-solid)" : "var(--pl-border-strong)", color: ready ? "var(--pl-on-solid)" : "var(--pl-text-faint)" }}
            >
              {submitting ? "Recording…" : "Confirm sale"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, color: "var(--pl-text-eyebrow)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
