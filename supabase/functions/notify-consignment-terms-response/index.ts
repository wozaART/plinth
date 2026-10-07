import { corsHeaders } from "../_shared/cors.ts";
import { escapeHtml, sendEmail } from "../_shared/resend.ts";
import { answersToRows } from "./terms-labels.ts";

interface NotifyPayload {
  responseId: string;
  galleryName: string;
  contactName: string;
  contactEmail: string;
  answers: Record<string, string>;
}

// Called right after a public, anonymous /consignment-terms submission —
// there's no user session to check, so there's nothing to authorize beyond
// what the public insert itself already allowed. The two emails are
// independent: one failing shouldn't swallow the other, so both sends are
// awaited and logged on their own rather than short-circuiting.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Partial<NotifyPayload>;
    const { responseId, galleryName, contactName, contactEmail, answers } = payload;

    if (!responseId || !galleryName || !contactName) {
      return json({ error: "Missing required fields." }, 400);
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const rows = answersToRows(answers || {});

    const results = await Promise.allSettled([
      adminEmail
        ? sendEmail(
            adminEmail,
            `New consignment terms response: ${galleryName}`,
            renderAdminEmail(galleryName, contactName, contactEmail, rows),
          )
        : Promise.resolve({ ok: false, error: "ADMIN_EMAIL not configured." }),
      contactEmail
        ? sendEmail(contactEmail, "Thanks for your consignment terms answers", renderContactEmail(contactName, galleryName))
        : Promise.resolve({ ok: false, error: "No contact email given." }),
    ]);

    for (const result of results) {
      if (result.status === "rejected") console.error("notify-consignment-terms-response send failed", result.reason);
      else if (!result.value.ok) console.error("notify-consignment-terms-response send failed", result.value.error);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unexpected error." }, 500);
  }
});

function renderAdminEmail(
  galleryName: string,
  contactName: string,
  contactEmail: string | undefined,
  rows: { label: string; value: string }[],
): string {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px;color:#6b6356;font-size:13px;">${escapeHtml(r.label)}</td><td style="padding:6px 12px;font-size:14px;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html><body style="font-family:sans-serif;color:#1c1a17;">
  <h2>${escapeHtml(galleryName)}</h2>
  <p>${escapeHtml(contactName)}${contactEmail ? ` · ${escapeHtml(contactEmail)}` : ""}</p>
  <table style="border-collapse:collapse;width:100%;max-width:560px;">${rowsHtml}</table>
</body></html>`;
}

function renderContactEmail(contactName: string, galleryName: string): string {
  return `<!doctype html>
<html><body style="font-family:sans-serif;color:#1c1a17;">
  <p>Hi ${escapeHtml(contactName)},</p>
  <p>Thanks for sharing ${escapeHtml(galleryName)}'s consignment terms with Woza Art. We'll be in touch if we have follow-up questions.</p>
</body></html>`;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
