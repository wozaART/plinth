"use client";

import { useEffect, useState } from "react";
import ImageLightbox from "@/components/shared/ImageLightbox";
import { linkKindLabel } from "@/lib/artist-profile";
import { getArtistProfileForContact, getArtistProfileForGallery } from "@/lib/supabase/actions";
import { avatarBg, initials } from "@/lib/utils";
import type { ArtistPublicProfile } from "@/lib/types";

const eyebrow = { fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pl-text-eyebrow)" } as const;
const bg = (url: string) => ({ backgroundImage: `url(${JSON.stringify(url)})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--pl-sidebar)" });

interface ArtistProfileDrawerProps {
  // Open by artist id, or by contact id for a gallery contact keyed by email.
  artistId?: string;
  contactId?: string;
  // Shown while the profile loads, and if it can't be.
  artistName: string;
  onClose: () => void;
}

export default function ArtistProfileDrawer({ artistId, contactId, artistName, onClose }: ArtistProfileDrawerProps) {
  const [profile, setProfile] = useState<ArtistPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = contactId ? await getArtistProfileForContact(contactId) : await getArtistProfileForGallery(artistId ?? "");
        if (!cancelled) setProfile(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this profile.");
      }
    })();
    return () => { cancelled = true; };
  }, [artistId, contactId]);

  const name = profile?.name ?? artistName;
  const empty = profile && !profile.bio && !profile.links.length && !profile.works.length && !profile.studioPhotos.length && !profile.profilePhoto;

  return (
    <div className="anim-scrim" style={{ position: "fixed", inset: 0, zIndex: 55, display: "flex" }}>
      <div style={{ flex: 1, background: "var(--pl-scrim, rgba(23,21,15,.32))" }} onClick={onClose} />
      <div className="anim-drawer" role="dialog" aria-label={`${name} profile`} style={{ width: "min(600px,100%)", background: "var(--pl-bg-app)", borderLeft: "1px solid var(--pl-border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--pl-border)", position: "sticky", top: 0, background: "var(--pl-bg-app)", zIndex: 1 }}>
          <span style={eyebrow}>Artist profile</span>
          <button onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--pl-border)", background: "none", fontSize: 17, cursor: "pointer", color: "var(--pl-text-soft)" }}>×</button>
        </div>

        <div style={{ padding: "24px 24px 40px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {profile?.profilePhoto ? (
              <button type="button" aria-label="View profile photo" onClick={() => setZoomed({ url: profile.profilePhoto!.imageUrl, alt: `${name} profile photo` })} style={{ width: 76, height: 76, borderRadius: "50%", border: "1px solid var(--pl-border)", cursor: "zoom-in", flexShrink: 0, padding: 0, ...bg(profile.profilePhoto.imageUrl) }} />
            ) : (
              <div style={{ width: 76, height: 76, borderRadius: "50%", background: avatarBg(0), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{initials(name)}</div>
            )}
            <div>
              <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 26, fontWeight: 550, margin: 0, letterSpacing: "-.015em" }}>{name}</h2>
              {profile && (profile.practice || profile.city) && (
                <div style={{ fontSize: 13.5, color: "var(--pl-text-soft)", marginTop: 3 }}>{[profile.practice, profile.city].filter(Boolean).join(" · ")}</div>
              )}
            </div>
          </div>

          {!profile && !error && <div style={{ marginTop: 30, fontSize: 14, color: "var(--pl-text-soft)" }}>Loading profile…</div>}
          {error && <div role="alert" style={{ marginTop: 30, fontSize: 14, color: "var(--pl-declined-fg)" }}>{error}</div>}
          {empty && <div style={{ marginTop: 30, fontSize: 14, color: "var(--pl-text-soft)" }}>{name} hasn&apos;t filled in their profile yet.</div>}

          {profile?.bio && (
            <section style={{ marginTop: 26 }}>
              <div style={{ ...eyebrow, marginBottom: 6 }}>About</div>
              <p style={{ fontSize: 14, color: "var(--pl-text-secondary)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{profile.bio}</p>
            </section>
          )}

          {!!profile?.links.length && (
            <section style={{ marginTop: 26 }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Websites &amp; socials</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.links.map(l => (
                  <a key={`${l.kind}-${l.url}`} href={l.url} target="_blank" rel="noopener noreferrer nofollow" title={l.url} style={{ fontSize: 13, padding: "7px 13px", borderRadius: 20, border: "1px solid var(--pl-border-strong)", background: "var(--pl-surface)", color: "var(--pl-text-secondary)", textDecoration: "none" }}>
                    {linkKindLabel(l.kind)} ↗
                  </a>
                ))}
              </div>
            </section>
          )}

          {!!profile?.works.length && (
            <section style={{ marginTop: 28 }}>
              <div style={{ ...eyebrow, marginBottom: 10 }}>Portfolio ({profile.works.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
                {profile.works.map(w => (
                  <button key={w.id} type="button" onClick={() => setZoomed({ url: w.imageUrl, alt: w.title })} style={{ textAlign: "left", border: "1px solid var(--pl-border)", borderRadius: 12, overflow: "hidden", background: "var(--pl-surface)", padding: 0, cursor: "zoom-in" }}>
                    <div style={{ height: 130, ...bg(w.imageUrl) }} />
                    <div style={{ padding: "9px 11px 11px" }}>
                      <div style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 14, fontWeight: 600 }}>{w.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--pl-text-soft)", marginTop: 2 }}>{[w.year, w.medium, w.dimensions].filter(Boolean).join(" · ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!!profile?.studioPhotos.length && (
            <section style={{ marginTop: 28 }}>
              <div style={{ ...eyebrow, marginBottom: 10 }}>In the studio</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
                {profile.studioPhotos.map(p => (
                  <button key={p.id} type="button" aria-label="View studio photo" onClick={() => setZoomed({ url: p.imageUrl, alt: `${name} studio` })} style={{ height: 120, borderRadius: 12, border: "1px solid var(--pl-border)", cursor: "zoom-in", padding: 0, ...bg(p.imageUrl) }} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      {zoomed && <ImageLightbox url={zoomed.url} alt={zoomed.alt} onClose={() => setZoomed(null)} />}
    </div>
  );
}
