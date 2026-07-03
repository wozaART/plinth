import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { renderArtistInviteEmail } from "./email-template.ts";

interface InvitePayload {
  galleryId: string;
  galleryName: string;
  accentColor?: string;
  appUrl: string;
  inviterName: string;
  artistEmail: string;
  artistName?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const { galleryId, galleryName, appUrl, inviterName, artistEmail } = payload;
    const accentColor = payload.accentColor || "#1c1a17";
    const artistName = payload.artistName?.trim() || "";

    if (!galleryId || !galleryName || !appUrl || !inviterName || !artistEmail) {
      return json({ error: "Missing required fields." }, 400);
    }
    if (!EMAIL_RE.test(artistEmail)) {
      return json({ error: "Invalid email address." }, 400);
    }

    // Scoped to the calling gallery owner's own JWT — RLS on artist_invites
    // (owns_gallery + invited_by = auth.uid()) is what actually authorizes
    // this insert, so no service-role key is needed here.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return json({ error: "Not signed in." }, 401);
    }

    const { data: invite, error: insertError } = await supabase
      .from("artist_invites")
      .insert({
        gallery_id: galleryId,
        invited_by: user.id,
        email: artistEmail,
        full_name: artistName || null,
      })
      .select("token, expires_at")
      .single();

    if (insertError || !invite) {
      const isDuplicate = insertError?.code === "23505";
      return json(
        { error: isDuplicate ? "This artist already has a pending invite." : insertError?.message },
        isDuplicate ? 409 : 400,
      );
    }

    const inviteUrl = `${appUrl.replace(/\/$/, "")}/signin?invite=${invite.token}`;
    const expiryDate = new Date(invite.expires_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = renderArtistInviteEmail({
      galleryName,
      accentColor,
      artistName,
      inviterName,
      inviteUrl,
      expiryDate,
      appUrl,
    });

    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "Plinth <onboarding@resend.dev>";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [artistEmail],
        subject: `${galleryName} invited you to join their artist portal`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      return json({ error: `Resend error: ${detail}` }, 502);
    }

    return json({ ok: true }, 200);
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
