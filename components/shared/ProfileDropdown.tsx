"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface ProfileOption {
  kind: "gallery" | "artist";
  name: string;
  detail: string;
  href: string;
}

const KIND_LABEL = { gallery: "Gallery", artist: "Artist" } as const;

/** Sidebar identity block that doubles as a profile switcher. */
export default function ProfileDropdown({ current, options, tone }: { current: "gallery" | "artist"; options: ProfileOption[]; tone: "light" | "dark" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find(o => o.kind === current) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const dark = tone === "dark";
  const text = dark ? "var(--pl-on-dark)" : "var(--pl-text)";
  const soft = dark ? "var(--pl-on-dark-faint)" : "var(--pl-text-soft)";
  const eyebrow = dark ? "var(--pl-on-dark-soft)" : "var(--pl-text-eyebrow)";
  const border = dark ? "var(--pl-border-dark)" : "var(--pl-border)";

  return (
    <div ref={ref} style={{ position: "relative", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, marginBottom: 8 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", padding: "11px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: text }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: eyebrow }}>{KIND_LABEL[active.kind]}</span>
          <span style={{ display: "block", fontSize: 14, fontWeight: 600, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{active.name}</span>
          <span style={{ display: "block", fontSize: 11.5, color: soft, marginTop: 1 }}>{active.detail}</span>
        </span>
        <span aria-hidden style={{ fontSize: 11, color: soft, transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && (
        <div role="listbox" style={{ position: "absolute", top: "100%", left: 10, right: 10, zIndex: 20, marginTop: 4, background: dark ? "var(--pl-surface-dark)" : "var(--pl-surface)", border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 12px 30px rgba(0,0,0,.18)", padding: 4 }}>
          {options.map(o => {
            const selected = o.kind === current;
            return (
              <button
                key={o.kind}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { setOpen(false); if (!selected) router.push(o.href); }}
                style={{ display: "block", width: "100%", padding: "9px 12px", borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left", background: selected ? (dark ? "rgba(255,255,255,.08)" : "var(--pl-sidebar)") : "transparent", color: text }}
              >
                <span style={{ display: "block", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: eyebrow }}>{KIND_LABEL[o.kind]}{selected ? " · current" : ""}</span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{o.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: soft }}>{o.detail}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
