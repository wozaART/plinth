import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";
import { authenticate, formatDate, formatRand, getArtistEmail, renderNoticeEmail } from "../_shared/notice.ts";

interface SaleNoticePayload {
  saleId: string;
  appUrl: string;
}

// Tells an artist that one of their works sold. The caller is the gallery
// owner who just recorded the sale; every figure in the email is read back
// from the database under their JWT (RLS only returns sales in galleries
// they own), never taken from the request body. The buyer's identity is
// deliberately left out — artists don't see it anywhere else either.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (!auth) return json({ error: "Not signed in." }, 401);

    const { saleId, appUrl } = (await req.json()) as Partial<SaleNoticePayload>;
    if (!saleId || !appUrl) return json({ error: "Missing required fields." }, 400);

    const { data: sale, error } = await auth.supabase
      .from("sales")
      .select(
        "artist_id, artist_amount_cents, sold_at, payout_due_at, catalogue_works(title), galleries(name, theme_colors)",
      )
      .eq("id", saleId)
      .single();
    if (error || !sale) return json({ error: "This sale could not be found." }, 404);

    const artistEmail = await getArtistEmail(sale.artist_id);
    if (!artistEmail) return json({ error: "This artist has no email address on file." }, 422);

    const { data: artist } = await auth.supabase
      .from("artist_profiles")
      .select("full_name")
      .eq("id", sale.artist_id)
      .maybeSingle();

    const gallery = sale.galleries as unknown as { name: string; theme_colors: { accent?: string } };
    const workTitle = (sale.catalogue_works as unknown as { title: string }).title;

    const html = renderNoticeEmail({
      galleryName: gallery.name,
      accentColor: gallery.theme_colors?.accent ?? "",
      eyebrow: "Sale recorded",
      heading: `"${workTitle}" has sold`,
      greetingName: artist?.full_name ?? "",
      paragraphs: [
        `${gallery.name} has recorded the sale of "${workTitle}". Your payout will be recorded in your earnings, and you'll get another email when it's been paid.`,
      ],
      rows: [
        { label: "Work", value: workTitle },
        { label: "Sold on", value: formatDate(sale.sold_at) },
        { label: "Your payout", value: formatRand(sale.artist_amount_cents) },
        { label: "Payout due", value: formatDate(sale.payout_due_at) },
      ],
      ctaLabel: "View your earnings",
      ctaUrl: `${appUrl.replace(/\/$/, "")}/studio`,
      appUrl,
    });

    const result = await sendEmail(artistEmail, `"${workTitle}" has sold`, html);
    if (!result.ok) return json({ error: result.error }, 502);

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
