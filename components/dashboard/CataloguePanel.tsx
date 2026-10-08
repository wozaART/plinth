"use client";

import { useState } from "react";
import { CAT_STATUS_META, CAT_STATUSES } from "@/lib/constants";
import { artworkBg } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useGalleryConfig } from "@/lib/gallery-context";
import { createCatalogueWork, updateCatalogueWork, updateCatalogueWorkStatus, deleteCatalogueWork, recordSale, type CatalogueWorkInput, type RecordSaleInput } from "@/lib/supabase/actions";
import AddCatalogueWorkDrawer from "./AddCatalogueWorkDrawer";
import EditCatalogueWorkDrawer from "./EditCatalogueWorkDrawer";
import MarkAsSoldDrawer from "./MarkAsSoldDrawer";
import type { CatalogueWork, GalleryArtist } from "@/lib/types";

export default function CataloguePanel({ data, artists }: { data: CatalogueWork[]; artists: GalleryArtist[] }) {
  const [works, setWorks] = useState(data);
  const [filter, setFilter] = useState<"all" | string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogueWork | null>(null);
  const [selling, setSelling] = useState<CatalogueWork | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { business } = useGalleryConfig();
  const fmt = (amount: number | null) => (amount != null ? formatCurrency(amount, business.currencyCode) : "—");

  const filtered = filter === "all" ? works : works.filter(w => w.status === filter);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3800);
  }

  async function handleCreate(input: CatalogueWorkInput & { artistName: string }) {
    const tempId = crypto.randomUUID();
    const placeholder: CatalogueWork = {
      id: tempId,
      title: input.title,
      artistId: input.artistId,
      artist: input.artistName,
      price: fmt(input.price),
      priceRaw: input.price,
      agreedPrice: fmt(input.agreedPrice),
      agreedPriceRaw: input.agreedPrice,
      commissionRatePct: input.commissionRatePct,
      status: input.status,
      consignedDate: input.consignedDate ?? "—",
      consignedDateRaw: input.consignedDate,
      submissionId: null,
    };
    setWorks(prev => [placeholder, ...prev]);
    setAddOpen(false);
    notify(`"${input.title}" added to the catalogue.`);
    try {
      const { id } = await createCatalogueWork(input);
      setWorks(prev => prev.map(w => (w.id === tempId ? { ...w, id } : w)));
    } catch (err) {
      setWorks(prev => prev.filter(w => w.id !== tempId));
      notify(err instanceof Error ? err.message : `Couldn't add "${input.title}" — try again.`);
    }
  }

  async function handleSave(id: string, input: Partial<CatalogueWorkInput>) {
    const previous = works;
    setWorks(prev => prev.map(w => w.id === id ? {
      ...w,
      title: input.title ?? w.title,
      price: input.price !== undefined ? fmt(input.price) : w.price,
      priceRaw: input.price !== undefined ? input.price : w.priceRaw,
      agreedPrice: input.agreedPrice !== undefined ? fmt(input.agreedPrice) : w.agreedPrice,
      agreedPriceRaw: input.agreedPrice !== undefined ? input.agreedPrice : w.agreedPriceRaw,
      commissionRatePct: input.commissionRatePct !== undefined ? input.commissionRatePct : w.commissionRatePct,
      consignedDate: input.consignedDate !== undefined ? (input.consignedDate ?? "—") : w.consignedDate,
      consignedDateRaw: input.consignedDate !== undefined ? input.consignedDate : w.consignedDateRaw,
      status: input.status ?? w.status,
    } : w));
    setEditing(null);
    notify("Catalogue entry updated.");
    try {
      await updateCatalogueWork(id, input);
    } catch (err) {
      setWorks(previous);
      notify(err instanceof Error ? err.message : "Couldn't save those changes — try again.");
    }
  }

  async function handleStatusChange(id: string, status: CatalogueWork["status"]) {
    if (status === "sold") {
      const work = works.find(w => w.id === id);
      if (work) setSelling(work);
      return;
    }
    const previous = works;
    setWorks(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    try {
      await updateCatalogueWorkStatus(id, status);
    } catch (err) {
      setWorks(previous);
      notify(err instanceof Error ? err.message : "Couldn't update that status — try again.");
    }
  }

  async function handleRecordSale(input: RecordSaleInput) {
    const work = selling;
    if (!work) return;
    try {
      await recordSale(input);
      setWorks(prev => prev.map(w => w.id === work.id ? { ...w, status: "sold" } : w));
      setSelling(null);
      notify(`"${work.title}" marked as sold.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't record that sale — try again.");
    }
  }

  async function handleDelete(id: string) {
    const previous = works;
    setWorks(prev => prev.filter(w => w.id !== id));
    setEditing(null);
    try {
      await deleteCatalogueWork(id);
    } catch (err) {
      setWorks(previous);
      notify(err instanceof Error ? err.message : "Couldn't remove that work — try again.");
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 12px", borderBottom: "1px solid var(--pl-border)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", ...CAT_STATUSES] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "var(--pl-solid)" : "var(--pl-border-strong)", background: filter === f ? "var(--pl-solid)" : "var(--pl-surface)", color: filter === f ? "var(--pl-on-solid)" : "var(--pl-text-muted)", cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setAddOpen(true)} style={{ fontSize: 13, padding: "8px 14px", background: "var(--pl-solid)", color: "var(--pl-on-solid)", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Add work</button>
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
                <tr key={w.id} style={{ borderBottom: "1px solid var(--pl-divider)" }}>
                  <td style={{ padding: "13px 12px", cursor: "pointer" }} onClick={() => setEditing(w)}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 38, height: 46, borderRadius: 4, background: artworkBg(i), flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14.5, fontWeight: 600 }}>{w.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, color: "var(--pl-text-secondary)", cursor: "pointer" }} onClick={() => setEditing(w)}>{w.artist}</td>
                  <td style={{ padding: "13px 12px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }} onClick={() => setEditing(w)}>{w.price}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <select
                      value={w.status}
                      onChange={e => handleStatusChange(w.id, e.target.value as CatalogueWork["status"])}
                      style={{ fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 20, background: meta.bg, color: meta.fg, border: "none", textTransform: "capitalize", appearance: "none", cursor: "pointer" }}
                    >
                      {CAT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px 0", color: "var(--pl-text-eyebrow)", fontSize: 14 }}>No works in this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && <AddCatalogueWorkDrawer artists={artists} onClose={() => setAddOpen(false)} onCreate={handleCreate} />}
      {editing && <EditCatalogueWorkDrawer work={editing} onClose={() => setEditing(null)} onSave={handleSave} onDelete={handleDelete} />}
      {selling && <MarkAsSoldDrawer work={selling} onClose={() => setSelling(null)} onConfirm={handleRecordSale} />}

      {toast && (
        <div className="anim-toast" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
