import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { escapeHtml } from "./resend.ts";

export interface NoticeRow {
  label: string;
  value: string;
}

export interface NoticeEmailParams {
  galleryName: string;
  accentColor: string;
  eyebrow: string;
  heading: string;
  greetingName: string;
  paragraphs: string[];
  rows: NoticeRow[];
  ctaLabel: string;
  ctaUrl: string;
  appUrl: string;
}

export function formatRand(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Accent colours end up inside a style attribute; anything that isn't a plain
// hex colour falls back to the house ink colour.
function safeColor(value: string | undefined): string {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : "#1c1a17";
}

/**
 * Authorizes the caller by their own JWT (RLS is what scopes the row reads in
 * each function), and returns a client for those reads plus a service-role
 * client used only to look up the artist's sign-in email, which a gallery
 * owner can't read through RLS.
 */
export async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return { supabase, user };
}

export async function getArtistEmail(artistId: string): Promise<string | null> {
  const admin: SupabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await admin.auth.admin.getUserById(artistId);
  if (error) return null;
  return data.user?.email ?? null;
}

export function renderNoticeEmail(params: NoticeEmailParams): string {
  const galleryName = escapeHtml(params.galleryName);
  const accentColor = safeColor(params.accentColor);
  const ctaUrl = escapeHtml(params.ctaUrl);
  const appUrl = escapeHtml(params.appUrl);

  const paragraphs = params.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 20px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#4a453d;">${escapeHtml(p)}</p>`,
    )
    .join("\n");

  const rows = params.rows
    .map(
      (r) => `<tr>
                  <td style="padding:10px 0; border-top:1px solid #e8e4dc; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#9a8f7c;">${escapeHtml(r.label)}</td>
                  <td align="right" style="padding:10px 0; border-top:1px solid #e8e4dc; font-family:Helvetica, Arial, sans-serif; font-size:14px; color:#1c1a17;">${escapeHtml(r.value)}</td>
                </tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(params.heading)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f2ee; -webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f2ee;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e8e4dc;">
          <tr>
            <td align="center" style="padding:32px 40px; background-color:#1c1a17;">
              <span style="font-family:Georgia, 'Times New Roman', serif; font-size:20px; letter-spacing:1px; color:#ffffff;">${galleryName}</span>
            </td>
          </tr>
          <tr>
            <td style="height:4px; line-height:4px; font-size:0; background-color:${accentColor};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:40px 40px 8px;">
              <p style="margin:0 0 8px; font-family:Georgia, 'Times New Roman', serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#9a8f7c;">${escapeHtml(params.eyebrow)}</p>
              <h1 style="margin:0 0 24px; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.35; color:#1c1a17; font-weight:400;">${escapeHtml(params.heading)}</h1>
              <p style="margin:0 0 20px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#4a453d;">Hi ${escapeHtml(params.greetingName || "there")},</p>
              ${paragraphs}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:8px; background-color:${accentColor};">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">${escapeHtml(params.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.6; color:#b3a996;">
                Woza Art &middot; Gallery &amp; artist management &middot; <a href="${appUrl}" style="color:#b3a996;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
