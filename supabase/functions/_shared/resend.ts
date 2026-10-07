export type ResendResult = { ok: true } | { ok: false; error: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEmail(to: string, subject: string, html: string): Promise<ResendResult> {
  const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "Plinth <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, error: `Resend error: ${detail}` };
  }
  return { ok: true };
}
