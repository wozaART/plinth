"use client";

import { useState, useTransition } from "react";
import { connectCustomDomain, refreshDomainStatus, disconnectCustomDomain } from "@/lib/supabase/domain-actions";
import { refreshMailDomainStatus, removeMailDomain, setUpMailDomain, updateGalleryMail } from "@/lib/supabase/mail-actions";
import type { MailDnsRecord } from "@/lib/resend/domains";
import { updateGalleryTheme } from "@/lib/supabase/theme-actions";
import { ACCENT_SWATCHES, BODY_FONT_CARDS, DISPLAY_FONT_CARDS, INK_OPTIONS, SIDEBAR_OPTIONS, isHexColor, onAccent } from "@/lib/theme-colors";
import type { DnsRecordInstruction } from "@/lib/vercel/domains";

export interface GalleryThemeSettings {
  mode: string;
  accent: string;
  ink: string;
  sidebar: string;
  fontDisplay: string;
  fontBody: string;
}

const MAIL_STATUS_LABEL: Record<string, string> = {
  none: "Not set up",
  pending: "Pending verification",
  verified: "Verified",
  error: "Verification failed",
};

export interface GalleryMailSettings {
  localPart: string | null;
  replyTo: string | null;
  /** Platform mail domain, shown in the From preview. Unset until configured. */
  domain: string | null;
  /** Resend verification state of the gallery's custom domain. */
  domainStatus: string;
  domainRegistered: boolean;
}

interface SettingsPanelProps {
  customDomain: string | null;
  domainStatus: string;
  theme: GalleryThemeSettings;
  mail?: GalleryMailSettings;
}

export default function SettingsPanel({ customDomain, domainStatus, theme, mail }: SettingsPanelProps) {
  const [mailLocalPart, setMailLocalPart] = useState(mail?.localPart ?? "");
  const [mailReplyTo, setMailReplyTo] = useState(mail?.replyTo ?? "");
  const [mailError, setMailError] = useState<string | null>(null);
  const [mailSaved, setMailSaved] = useState(false);
  const [mailPending, startMailTransition] = useTransition();
  const [mailDomainStatus, setMailDomainStatus] = useState(mail?.domainStatus ?? "none");
  const [mailDomainRegistered, setMailDomainRegistered] = useState(mail?.domainRegistered ?? false);
  const [mailRecords, setMailRecords] = useState<MailDnsRecord[] | null>(null);
  const [mailDomainError, setMailDomainError] = useState<string | null>(null);
  const [mailDomainPending, startMailDomainTransition] = useTransition();

  function runMailDomain(task: () => Promise<void>, fallback: string) {
    setMailDomainError(null);
    startMailDomainTransition(async () => {
      try {
        await task();
      } catch (err) {
        setMailDomainError(err instanceof Error ? err.message : fallback);
      }
    });
  }

  const handleSetUpMailDomain = () =>
    runMailDomain(async () => {
      setMailRecords(await setUpMailDomain());
      setMailDomainRegistered(true);
      setMailDomainStatus("pending");
    }, "Couldn't set up email for this domain.");

  const handleCheckMailDomain = () =>
    runMailDomain(async () => {
      const result = await refreshMailDomainStatus();
      setMailRecords(result.records);
      setMailDomainStatus(result.status);
    }, "Couldn't check the email domain.");

  const handleRemoveMailDomain = () =>
    runMailDomain(async () => {
      await removeMailDomain();
      setMailRecords(null);
      setMailDomainRegistered(false);
      setMailDomainStatus("none");
    }, "Couldn't remove the email domain.");

  const sendingDomain = mailDomainStatus === "verified" && customDomain ? customDomain : null;
  const fallbackAddress = `support@${mail?.domain ?? "woza.art"}`;

  function handleSaveMail(formData: FormData) {
    setMailError(null);
    setMailSaved(false);
    startMailTransition(async () => {
      try {
        await updateGalleryMail(formData);
        setMailSaved(true);
      } catch (err) {
        setMailError(err instanceof Error ? err.message : "Couldn't save the email settings.");
      }
    });
  }

  const [domain, setDomain] = useState(customDomain ?? "");
  const [status, setStatus] = useState(domainStatus);
  const [dnsRecords, setDnsRecords] = useState<DnsRecordInstruction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [themeAccent, setThemeAccent] = useState(theme.accent);
  const [themeInk, setThemeInk] = useState(theme.ink);
  const [themeSidebar, setThemeSidebar] = useState(theme.sidebar);
  const [themeDisplay, setThemeDisplay] = useState(theme.fontDisplay);
  const [themeBody, setThemeBody] = useState(theme.fontBody);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeSaved, setThemeSaved] = useState(false);
  const [themePending, startThemeTransition] = useTransition();

  function handleSaveTheme(formData: FormData) {
    setThemeError(null);
    setThemeSaved(false);
    startThemeTransition(async () => {
      try {
        await updateGalleryTheme(formData);
        setThemeSaved(true);
      } catch (err) {
        setThemeError(err instanceof Error ? err.message : "Couldn't save the theme.");
      }
    });
  }

  function handleConnect(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const records = await connectCustomDomain(formData);
        setDnsRecords(records);
        setStatus("pending");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't connect that domain.");
      }
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      try {
        await refreshDomainStatus();
        setStatus(s => (s === "pending" ? "pending" : s));
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't check domain status.");
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectCustomDomain();
        setDomain("");
        setStatus("none");
        setDnsRecords(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't remove that domain.");
      }
    });
  }

  const STATUS_LABEL: Record<string, string> = {
    none: "Not connected",
    pending: "Pending verification",
    verified: "Connected",
    error: "Error",
  };

  const validAccent = isHexColor(themeAccent);
  const previewAccent = validAccent ? themeAccent : theme.accent;
  const light = theme.mode === "light";
  const previewInk = light ? themeInk : "var(--pl-solid)";
  const subLabel = { fontSize: 12, color: "var(--pl-text-soft)", margin: "0 0 8px" } as const;
  const sectionLabel = { fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: "var(--pl-text-eyebrow)", marginBottom: 10 } as const;
  const chip = (on: boolean) => ({
    display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 11, cursor: "pointer", fontSize: 13,
    border: `1.5px solid ${on ? "var(--pl-text)" : "var(--pl-border)"}`,
    background: on ? "var(--pl-text)" : "var(--pl-surface)",
    color: on ? "var(--pl-bg-app)" : "var(--pl-text-secondary)",
  }) as const;
  const card = (on: boolean) => ({
    flex: 1, minWidth: 130, textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
    border: `1.5px solid ${on ? "var(--pl-text)" : "var(--pl-border)"}`,
    background: on ? "var(--pl-bg-shell)" : "var(--pl-surface)", color: "var(--pl-text)",
  }) as const;
  const swatchBox = { width: 15, height: 15, borderRadius: 4, border: "1px solid rgba(0,0,0,.15)", display: "inline-block" } as const;

  return (
    <div className="dash-pad" style={{ padding: 24, maxWidth: 560 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Custom domain</h2>
        <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: 0 }}>
          Point a domain you already own at this portal.
        </p>
      </div>

      {domain && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}>
          <span>{domain}</span>
          <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
      )}

      {!domain && (
        <form
          action={handleConnect}
          style={{ display: "flex", gap: 8, marginBottom: 16 }}
        >
          <input
            name="domain"
            placeholder="gallery.example.com"
            required
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--pl-border-input)", fontSize: 13, background: "var(--pl-surface)", color: "var(--pl-text)" }}
          />
          <button
            type="submit"
            disabled={isPending}
            style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--pl-accent)", color: "var(--pl-on-accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {isPending ? "Connecting…" : "Connect"}
          </button>
        </form>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "var(--pl-declined-fg)", marginBottom: 16 }}>{error}</div>
      )}

      {dnsRecords && status === "pending" && (
        <div style={{ border: "1px solid var(--pl-border)", borderRadius: 10, padding: 14, marginBottom: 16, background: "var(--pl-surface)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Add this DNS record at your registrar</div>
          {dnsRecords.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, fontSize: 12.5, fontFamily: "var(--font-geist-mono, monospace)", padding: "4px 0" }}>
              <span style={{ color: "var(--pl-text-muted)" }}>{r.type}</span>
              <span>{r.name}</span>
              <span style={{ color: "var(--pl-text-muted)" }}>→</span>
              <span>{r.value}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--pl-text-soft)", marginTop: 8 }}>
            DNS changes can take a few hours to propagate. Check back once it&apos;s had time to update.
          </div>
        </div>
      )}

      {domain && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-text)", fontSize: 12.5, cursor: "pointer" }}
          >
            Check status
          </button>
          <button
            onClick={handleDisconnect}
            disabled={isPending}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-declined-fg)", fontSize: 12.5, cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      )}

      {mail && (
        <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--pl-border)" }}>
          <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Email</h2>
          <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: "0 0 16px" }}>
            Choose the address your emails to artists come from. It applies once your own domain is set up below.
          </p>

          <form action={handleSaveMail} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "block" }}>
              <div style={sectionLabel}>Sender address</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  name="localPart"
                  value={mailLocalPart}
                  onChange={e => setMailLocalPart(e.target.value.toLowerCase())}
                  placeholder="your-gallery"
                  autoComplete="off"
                  maxLength={32}
                  style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--pl-border-input)", fontSize: 13, background: "var(--pl-surface)", color: "var(--pl-text)" }}
                />
                <span style={{ fontSize: 13, color: "var(--pl-text-muted)" }}>@{sendingDomain ?? customDomain ?? "your-domain.com"}</span>
              </div>
            </label>

            <label style={{ display: "block" }}>
              <div style={sectionLabel}>Reply-to address</div>
              <p style={subLabel}>Where artists&apos; replies go. Use an inbox you read.</p>
              <input
                name="replyTo"
                type="email"
                value={mailReplyTo}
                onChange={e => setMailReplyTo(e.target.value)}
                placeholder="hello@yourgallery.com"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--pl-border-input)", fontSize: 13, background: "var(--pl-surface)", color: "var(--pl-text)" }}
              />
            </label>

            <div style={{ fontSize: 12.5, color: "var(--pl-text-soft)" }}>
              Artists will see emails from{" "}
              <strong style={{ color: "var(--pl-text)" }}>
                {sendingDomain && mailLocalPart ? `${mailLocalPart}@${sendingDomain}` : fallbackAddress}
              </strong>
              {!sendingDomain && " until your domain is verified."}
            </div>

            {mailError && <div role="alert" style={{ fontSize: 13, color: "var(--pl-declined-fg)" }}>{mailError}</div>}
            {mailSaved && <div role="status" style={{ fontSize: 13, color: "var(--pl-approved-fg)" }}>Email settings saved.</div>}

            <div>
              <button
                type="submit"
                disabled={mailPending}
                style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--pl-accent)", color: "var(--pl-on-accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {mailPending ? "Saving…" : "Save email settings"}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 24 }}>
            <div style={sectionLabel}>Send from your own domain</div>
            {!customDomain ? (
              <p style={subLabel}>Connect a custom domain above to send email from it.</p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13 }}>
                  <span>{customDomain}</span>
                  <span style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 20, background: "var(--pl-neutral-chip-bg)", color: "var(--pl-neutral-chip-fg)" }}>
                    {mailDomainRegistered ? (MAIL_STATUS_LABEL[mailDomainStatus] ?? mailDomainStatus) : "Not set up"}
                  </span>
                </div>

                {mailRecords && mailDomainStatus !== "verified" && (
                  <div style={{ border: "1px solid var(--pl-border)", borderRadius: 10, padding: 14, marginBottom: 12, background: "var(--pl-surface)" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Add these DNS records at your registrar</div>
                    {mailRecords.map((r, i) => (
                      <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12.5, fontFamily: "var(--font-geist-mono, monospace)", padding: "4px 0", wordBreak: "break-all" }}>
                        <span style={{ color: "var(--pl-text-muted)" }}>{r.type}</span>
                        <span>{r.name}</span>
                        <span style={{ color: "var(--pl-text-muted)" }}>→</span>
                        <span>{r.priority !== undefined ? `${r.priority} ${r.value}` : r.value}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: "var(--pl-text-soft)", marginTop: 8 }}>
                      Until these are verified, email comes from {fallbackAddress}.
                    </div>
                  </div>
                )}

                {mailDomainError && <div role="alert" style={{ fontSize: 13, color: "var(--pl-declined-fg)", marginBottom: 12 }}>{mailDomainError}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                  {!mailDomainRegistered ? (
                    <button type="button" onClick={handleSetUpMailDomain} disabled={mailDomainPending} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-text)", fontSize: 12.5, cursor: "pointer" }}>
                      {mailDomainPending ? "Setting up…" : "Set up email"}
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={handleCheckMailDomain} disabled={mailDomainPending} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-text)", fontSize: 12.5, cursor: "pointer" }}>
                        {mailDomainPending ? "Checking…" : "Check status"}
                      </button>
                      <button type="button" onClick={handleRemoveMailDomain} disabled={mailDomainPending} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--pl-border)", background: "transparent", color: "var(--pl-declined-fg)", fontSize: 12.5, cursor: "pointer" }}>
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--pl-border)" }}>
        <h2 style={{ fontFamily: "var(--font-newsreader, serif)", fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Theming</h2>
        <p style={{ fontSize: 13, color: "var(--pl-text-muted)", margin: "0 0 16px" }}>
          Set the accent colour and fonts used across your portal and your artists&apos; studio.
        </p>

        <form action={handleSaveTheme} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <input type="hidden" name="accent" value={themeAccent} />
          <input type="hidden" name="ink" value={themeInk} />
          <input type="hidden" name="sidebar" value={themeSidebar} />
          <input type="hidden" name="fontDisplay" value={themeDisplay} />
          <input type="hidden" name="fontBody" value={themeBody} />

          <div>
            <div style={sectionLabel}>Accent colour</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              {ACCENT_SWATCHES.map(c => {
                const on = themeAccent.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={`Accent ${c}`}
                    aria-pressed={on}
                    onClick={() => setThemeAccent(c)}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${on ? "var(--pl-text)" : "transparent"}`, boxShadow: `0 0 0 2px ${on ? "var(--pl-bg-app)" : "transparent"}, 0 0 0 ${on ? "3px" : "1px"} ${on ? "var(--pl-text)" : "var(--pl-border)"}` }}
                  />
                );
              })}
              <label style={{ ...chip(false), padding: "6px 10px", position: "relative" }}>
                <span style={{ ...swatchBox, width: 18, height: 18, background: previewAccent }} />
                Custom
                <input type="color" aria-label="Pick a custom accent colour" value={previewAccent} onChange={e => setThemeAccent(e.target.value.toUpperCase())} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
              </label>
            </div>
          </div>

          {light && (
            <div>
              <div style={sectionLabel}>Ink &amp; canvas</div>
              <p style={subLabel}>Dark tone for buttons, headers &amp; the studio sidebar.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {INK_OPTIONS.map(o => (
                  <button key={o.color} type="button" aria-pressed={themeInk === o.color} onClick={() => setThemeInk(o.color)} style={chip(themeInk === o.color)}>
                    <span style={{ ...swatchBox, background: o.color }} />{o.name}
                  </button>
                ))}
              </div>
              <p style={subLabel}>Sidebar tint.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SIDEBAR_OPTIONS.map(o => (
                  <button key={o.color} type="button" aria-pressed={themeSidebar === o.color} onClick={() => setThemeSidebar(o.color)} style={chip(themeSidebar === o.color)}>
                    <span style={{ ...swatchBox, background: o.color }} />{o.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={sectionLabel}>Headline type</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {DISPLAY_FONT_CARDS.map(f => (
                <button key={f.id} type="button" aria-pressed={themeDisplay === f.id} onClick={() => setThemeDisplay(f.id)} style={card(themeDisplay === f.id)}>
                  <div style={{ fontFamily: f.stack, fontSize: 28, fontWeight: 600, lineHeight: 1 }}>Ag</div>
                  <div style={{ fontSize: 12.5, fontWeight: 550, marginTop: 6 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "var(--pl-text-soft)" }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionLabel}>Body type</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {BODY_FONT_CARDS.map(f => (
                <button key={f.id} type="button" aria-pressed={themeBody === f.id} onClick={() => setThemeBody(f.id)} style={card(themeBody === f.id)}>
                  <div style={{ fontFamily: f.stack, fontSize: 28, lineHeight: 1 }}>Ag</div>
                  <div style={{ fontSize: 12.5, fontWeight: 550, marginTop: 6 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "var(--pl-text-soft)" }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div
            aria-label="Theme preview"
            style={{ border: "1px solid var(--pl-border)", borderRadius: 12, overflow: "hidden", background: "var(--pl-surface)", fontFamily: BODY_FONT_CARDS.find(f => f.id === themeBody)?.stack }}
          >
            <div style={{ display: "flex" }}>
              {light && <div style={{ width: 64, background: themeSidebar, borderRight: "1px solid var(--pl-border)" }} />}
              <div style={{ padding: 16, flex: 1 }}>
                <div style={{ fontFamily: DISPLAY_FONT_CARDS.find(f => f.id === themeDisplay)?.stack, fontSize: 18, fontWeight: 600, color: previewInk, marginBottom: 4 }}>
                  Your gallery, your look
                </div>
                <div style={{ fontSize: 13, color: "var(--pl-text-muted)", marginBottom: 12 }}>
                  This is how headings, body text and buttons will appear.
                </div>
                <span style={{ display: "inline-block", padding: "7px 14px", borderRadius: 9, background: previewInk, color: "var(--pl-on-solid)", fontSize: 13, fontWeight: 600, marginRight: 8 }}>Primary</span>
                <span style={{ display: "inline-block", padding: "7px 14px", borderRadius: 9, background: previewAccent, color: onAccent(previewAccent), fontSize: 13, fontWeight: 600 }}>Accent</span>
              </div>
            </div>
          </div>

          {themeError && <div role="alert" style={{ fontSize: 13, color: "var(--pl-declined-fg)" }}>{themeError}</div>}
          {themeSaved && <div role="status" style={{ fontSize: 13, color: "var(--pl-approved-fg)" }}>Theme saved. Reload to see it everywhere.</div>}

          <div>
            <button
              type="submit"
              disabled={themePending || !validAccent}
              style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--pl-accent)", color: "var(--pl-on-accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {themePending ? "Saving…" : "Save theme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
