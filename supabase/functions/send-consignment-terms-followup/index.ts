import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";

interface FollowupPayload {
  responseId: string;
  message: string;
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

    const payload = (await req.json()) as Partial<FollowupPayload>;
    const { responseId, message } = payload;
    if (!responseId || !message?.trim()) {
      return json({ error: "Missing required fields." }, 400);
    }

    // RLS (not a service-role key) is what actually authorizes this: the
    // select below only returns a row if is_platform_owner() is true for
    // the calling JWT, and the insert below is gated the same way.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: "Not signed in." }, 401);

    const { data: responseRow, error: fetchError } = await supabase
      .from("consignment_terms_responses")
      .select("gallery_name, contact_name, contact_email")
      .eq("id", responseId)
      .single();

    if (fetchError || !responseRow) {
      return json({ error: fetchError?.message || "Response not found." }, 404);
    }

    const { error: insertError } = await supabase
      .from("consignment_terms_followups")
      .insert({ response_id: responseId, message: message.trim(), created_by: user.id });
    if (insertError) return json({ error: insertError.message }, 400);

    const { contact_name, contact_email } = responseRow;

    if (contact_email) {
      const email = await sendEmail(
        contact_email,
        "A follow-up on your consignment terms answers",
        `<!doctype html><html><body style="font-family:sans-serif;color:#1c1a17;">
          <p>Hi ${escapeHtml(contact_name)},</p>
          <p>${escapeHtml(message.trim()).replace(/\n/g, "<br>")}</p>
        </body></html>`,
      );
      if (!email.ok) console.error("send-consignment-terms-followup email failed", email.error);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unexpected error." }, 500);
  }
});

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
