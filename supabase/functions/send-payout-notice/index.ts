import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";
import { authenticate, formatDate, formatRand, getArtistEmail, renderNoticeEmail } from "../_shared/notice.ts";

interface PayoutNoticePayload {
  payoutId: string;
  appUrl: string;
}

// Tells an artist that the gallery has paid them, and asks them to confirm
// receipt (or raise a query) in the studio — the acknowledgement loop. Like
// send-sale-notice, everything in the email is read back under the calling
// gallery owner's JWT rather than trusted from the request.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (!auth) return json({ error: "Not signed in." }, 401);

    const { payoutId, appUrl } = (await req.json()) as Partial<PayoutNoticePayload>;
    if (!payoutId || !appUrl) return json({ error: "Missing required fields." }, 400);

    const { data: payout, error } = await auth.supabase
      .from("payouts")
      .select(
        "artist_id, amount_cents, status, paid_at, payment_reference, proof_of_payment_path, sales(catalogue_works(title)), galleries(name, theme_colors)",
      )
      .eq("id", payoutId)
      .single();
    if (error || !payout) return json({ error: "This payout could not be found." }, 404);
    if (payout.status !== "paid") return json({ error: "This payout hasn't been marked as paid." }, 409);

    const artistEmail = await getArtistEmail(payout.artist_id);
    if (!artistEmail) return json({ error: "This artist has no email address on file." }, 422);

    const { data: artist } = await auth.supabase
      .from("artist_profiles")
      .select("full_name")
      .eq("id", payout.artist_id)
      .maybeSingle();

    const gallery = payout.galleries as unknown as { name: string; theme_colors: { accent?: string } };
    const workTitle = (payout.sales as unknown as { catalogue_works: { title: string } }).catalogue_works.title;
    const amount = formatRand(payout.amount_cents);

    const rows = [
      { label: "Work", value: workTitle },
      { label: "Amount paid", value: amount },
      { label: "Paid on", value: formatDate(payout.paid_at) },
    ];
    if (payout.payment_reference) rows.push({ label: "Reference", value: payout.payment_reference });
    if (payout.proof_of_payment_path) rows.push({ label: "Proof of payment", value: "Available in your studio" });

    const html = renderNoticeEmail({
      galleryName: gallery.name,
      accentColor: gallery.theme_colors?.accent ?? "",
      eyebrow: "Payout sent",
      heading: `${amount} has been paid to you`,
      greetingName: artist?.full_name ?? "",
      paragraphs: [
        `${gallery.name} has paid your share of the sale of "${workTitle}". Please check that it has arrived, then confirm in your studio — or let the gallery know if something looks wrong.`,
      ],
      rows,
      ctaLabel: "Confirm receipt",
      ctaUrl: `${appUrl.replace(/\/$/, "")}/studio`,
      appUrl,
    });

    const result = await sendEmail(artistEmail, `${gallery.name} has paid you ${amount}`, html);
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
