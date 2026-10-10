import Link from "next/link";

type Profile = "gallery" | "artist";

const LABELS: Record<Profile, { title: string; href: string; blurb: string }> = {
  gallery: { title: "Gallery", href: "/dashboard", blurb: "Manage submissions, exhibitions and your catalogue." },
  artist: { title: "Artist", href: "/studio", blurb: "Manage your works, earnings and invitations." },
};

export default function ProfileSwitcher({ current }: { current: Profile }) {
  return (
    <div style={{ background: "var(--pl-surface)", border: "1px solid var(--pl-border)", borderRadius: 16, padding: "22px 24px", maxWidth: 720, marginBottom: 24 }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: "var(--font-newsreader, serif)" }}>Your profiles</div>
      <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: "0 0 16px" }}>This account is both a gallery and an artist. Switch between them at any time.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {(Object.keys(LABELS) as Profile[]).map(p => {
          const active = p === current;
          const { title, href, blurb } = LABELS[p];
          const style = { display: "block", padding: "14px 16px", borderRadius: 12, border: `1px solid ${active ? "var(--pl-accent)" : "var(--pl-border)"}`, background: active ? "var(--pl-sidebar)" : "transparent", color: "var(--pl-text)" } as const;
          const body = (
            <>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{title}{active && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "var(--pl-text-eyebrow)", textTransform: "uppercase", letterSpacing: ".08em" }}>Current</span>}</div>
              <div style={{ fontSize: 12.5, color: "var(--pl-text-muted)", marginTop: 4 }}>{blurb}</div>
            </>
          );
          return active ? <div key={p} style={style}>{body}</div> : <Link key={p} href={href} style={style}>{body}</Link>;
        })}
      </div>
    </div>
  );
}
