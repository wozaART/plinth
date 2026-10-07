import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { escapeHtml, sendEmail } from "../_shared/resend.ts";

interface InvitePayload {
  appUrl: string;
  contactName: string;
  contactEmail: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header." }, 401);
    }

    const payload = (await req.json()) as Partial<InvitePayload>;
    const { appUrl, contactName, contactEmail } = payload;

    if (!appUrl || !contactName || !contactEmail) {
      return json({ error: "Missing required fields." }, 400);
    }

    // Only the platform owner may send invites — checked via is_platform_owner(),
    // the same RLS-backing function that gates reading responses in the app.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: isOwner, error: ownerError } = await supabase.rpc("is_platform_owner");
    if (ownerError || !isOwner) {
      return json({ error: "Not authorized." }, 403);
    }

    const inviteUrl = `${appUrl.replace(/\/$/, "")}/consignment-terms?${new URLSearchParams({ contact_name: contactName, contact_email: contactEmail }).toString()}`;

    const email = await sendEmail(
      contactEmail,
      "A few questions about your gallery's consignment terms",
      `<!doctype html><html><body style="font-family:sans-serif;color:#1c1a17;">
        <p>Hi ${escapeHtml(contactName)},</p>
        <p>Could you share a few details about how your gallery pays its artists? It takes about five minutes:</p>
        <p><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
      </body></html>`,
    );
    if (!email.ok) return json({ error: email.error }, 502);

    return json({ ok: true, inviteUrl }, 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unexpected error." }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
