export type ResendResult = { ok: true } | { ok: false; error: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface Sender {
  from: string;
  replyTo?: string;
}

export interface GallerySender {
  name: string;
  mail_local_part?: string | null;
  reply_to_email?: string | null;
  custom_domain?: string | null;
  mail_domain_status?: string | null;
}

// Builds the From/Reply-To for a gallery. Once Resend has verified the
// gallery's own domain (and it has picked a local part) mail goes out from
// there; otherwise it comes from support@ on the platform domain, still under
// the gallery's name and with its reply-to.
export function resolveSender(
  gallery: GallerySender,
  platformDomain = Deno.env.get("MAIL_DOMAIN") || "woza.art",
): Sender {
  const ownDomain = gallery.mail_domain_status === "verified" ? gallery.custom_domain : null;
  const address =
    ownDomain && gallery.mail_local_part ? `${gallery.mail_local_part}@${ownDomain}` : `support@${platformDomain}`;
  // Strip anything that could break out of the quoted display name.
  const displayName = gallery.name.replace(/["\\<>\r\n,]/g, "").trim() || "Gallery";
  return {
    from: `"${displayName}" <${address}>`,
    replyTo: gallery.reply_to_email || undefined,
  };
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  sender?: Sender,
): Promise<ResendResult> {
  const fromAddress = sender?.from || Deno.env.get("RESEND_FROM_EMAIL") || "Woza Art <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html,
      ...(sender?.replyTo ? { reply_to: sender.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, error: `Resend error: ${detail}` };
  }
  return { ok: true };
}
