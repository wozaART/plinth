"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { getPayoutProofUrl } from "@/lib/supabase/queries";
import type { SubmissionStatus, ExhibitionType, ExhibitionStatus, CatalogueStatus } from "@/lib/types";

async function supabaseServer() {
  return createClient(await cookies());
}

async function resolveAppUrl() {
  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    appUrl = `${protocol}://${host}`;
  }
  return appUrl;
}

// Notices go out after the sale/payout is already committed, so a failed
// email must never fail the action — it's returned for the UI to surface.
async function sendNotice(fn: "send-sale-notice" | "send-payout-notice", body: Record<string, string>) {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.functions.invoke(fn, { body: { ...body, appUrl: await resolveAppUrl() } });
    if (error) {
      const detail = await error.context?.json?.().catch(() => null);
      return detail?.error || error.message;
    }
    return data?.error as string | undefined;
  } catch (err) {
    return err instanceof Error ? err.message : "Failed to send notification.";
  }
}

export async function decideSubmission(id: string, status: SubmissionStatus, note: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("submissions")
    .update({ status, note, ack: status === "declined" ? false : null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function ackDeclinedSubmission(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("submissions_update_artist_ack", { p_submission_id: id });
  if (error) throw error;
  revalidatePath("/studio");
}

export async function createSubmission(formData: FormData) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const gallery = await getCurrentGallery(supabase);

  const title = String(formData.get("title") || "Untitled");
  const medium = String(formData.get("medium") || "");
  const dim = String(formData.get("dim") || "");
  const year = Number(formData.get("year")) || new Date().getFullYear();
  const price = Number(String(formData.get("price") || "").replace(/[^0-9.]/g, "")) || null;
  const statement = String(formData.get("statement") || "");
  const exhibitionId = String(formData.get("exhibitionId") || "") || null;
  const rulesAck = formData.get("rulesAck") === "true";

  // Generated up front (rather than reading it back after insert) so the
  // image can be uploaded and the row inserted with image_url already set
  // in one shot — an artist's update-after-insert would otherwise be
  // rejected by RLS, since the artist update policy only covers declined
  // submissions they're acknowledging.
  const submissionId = crypto.randomUUID();

  let imageUrl: string | null = null;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${submissionId}/original.${ext}`;
    const { error: uploadError } = await supabase.storage.from("submission-images").upload(path, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });
    if (!uploadError) {
      imageUrl = supabase.storage.from("submission-images").getPublicUrl(path).data.publicUrl;
    }
  }

  const { error } = await supabase.from("submissions").insert({
    id: submissionId,
    gallery_id: gallery.id,
    exhibition_id: exhibitionId,
    artist_id: user.id,
    title,
    medium,
    dim,
    year,
    price,
    statement,
    image_url: imageUrl,
    rules_ack: rulesAck,
  });
  if (error) throw error;

  revalidatePath("/studio");
  return { id: submissionId, title };
}

export async function createContact(input: { name: string; email: string; role: "Artist" | "Collector"; focus: string; sendInvite: boolean }) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const gallery = await getCurrentGallery(supabase);

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      gallery_id: gallery.id,
      name: input.name,
      email: input.email,
      role: input.role,
      focus: input.focus || null,
      last_contact_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;

  let inviteError: string | undefined;
  if (input.role === "Artist" && input.sendInvite) {
    try {
      await inviteArtist(input.email, input.name);
    } catch (err) {
      inviteError = err instanceof Error ? err.message : "Failed to send invitation.";
    }
  }

  revalidatePath("/dashboard");
  return { id: data.id, inviteError };
}

export async function deleteContact(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function inviteArtist(email: string, fullName: string) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const gallery = await getCurrentGallery(supabase);

  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    appUrl = `${protocol}://${host}`;
  }

  const { data, error } = await supabase.functions.invoke("send-artist-invite", {
    body: {
      galleryId: gallery.id,
      galleryName: gallery.name,
      accentColor: (gallery.theme_colors as unknown as { accent: string }).accent,
      appUrl,
      inviterName: user.user_metadata?.full_name || gallery.name,
      artistEmail: email,
      artistName: fullName,
    },
  });

  if (error) {
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);

  revalidatePath("/dashboard");
  return data;
}

// ── Exhibitions ──────────────────────────────────────────────────────────

export interface ExhibitionInput {
  title: string;
  type: ExhibitionType;
  status?: ExhibitionStatus;
  blurb: string;
  theme: string;
  mediumRequirements: string;
  sizeRequirements: string;
  rules: string;
  slots: number;
  submissionDeadline: string | null;
  openingDate: string | null;
  closingDate: string | null;
  deliveryDate: string | null;
}

function toExhibitionRow(input: Partial<ExhibitionInput>) {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.blurb !== undefined && { blurb: input.blurb || null }),
    ...(input.theme !== undefined && { theme: input.theme || null }),
    ...(input.mediumRequirements !== undefined && { medium_requirements: input.mediumRequirements || null }),
    ...(input.sizeRequirements !== undefined && { size_requirements: input.sizeRequirements || null }),
    ...(input.rules !== undefined && { rules: input.rules || null }),
    ...(input.slots !== undefined && { slots: input.slots }),
    ...(input.submissionDeadline !== undefined && { submission_deadline: input.submissionDeadline }),
    ...(input.openingDate !== undefined && { opening_date: input.openingDate }),
    ...(input.closingDate !== undefined && { closing_date: input.closingDate }),
    ...(input.deliveryDate !== undefined && { delivery_date: input.deliveryDate }),
  };
}

export async function createExhibition(input: ExhibitionInput) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "gallery") throw new Error("Not signed in.");

  const gallery = await getCurrentGallery(supabase);

  const { data, error } = await supabase
    .from("exhibitions")
    .insert({ gallery_id: gallery.id, status: "planning", title: input.title, ...toExhibitionRow(input) })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateExhibition(id: string, input: Partial<ExhibitionInput>) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("exhibitions").update(toExhibitionRow(input)).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function archiveExhibition(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("exhibitions").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function unarchiveExhibition(id: string, restoreStatus: ExhibitionStatus = "planning") {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("exhibitions").update({ status: restoreStatus }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteExhibition(id: string) {
  const supabase = await supabaseServer();

  const { count, error: countError } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("exhibition_id", id);
  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error("Cannot delete an exhibition with existing submissions — archive it instead.");
  }

  const { error } = await supabase.from("exhibitions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function inviteArtistToExhibition(
  exhibitionId: string,
  artist: { existingArtistId?: string; email: string; fullName?: string },
  message?: string,
) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const gallery = await getCurrentGallery(supabase);

  const { data: exhibition, error: exError } = await supabase
    .from("exhibitions")
    .select("title")
    .eq("id", exhibitionId)
    .single();
  if (exError) throw exError;

  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    appUrl = `${protocol}://${host}`;
  }

  const { data, error } = await supabase.functions.invoke("send-exhibition-invite", {
    body: {
      galleryId: gallery.id,
      galleryName: gallery.name,
      accentColor: (gallery.theme_colors as unknown as { accent: string }).accent,
      appUrl,
      inviterName: user.user_metadata?.full_name || gallery.name,
      artistEmail: artist.email,
      artistName: artist.fullName,
      existingArtistId: artist.existingArtistId,
      exhibitionId,
      exhibitionTitle: exhibition.title,
      message,
    },
  });

  if (error) {
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  if (data?.error) throw new Error(data.error);

  revalidatePath("/dashboard");
  return data;
}

export async function revokeExhibitionInvite(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("exhibition_invites").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function respondToExhibitionInvite(id: string, response: "accepted" | "declined") {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("exhibition_invites")
    .update({ status: response, responded_at: new Date().toISOString(), artist_id: user.id })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/studio");
}

// ── Catalogue ────────────────────────────────────────────────────────────

export interface CatalogueWorkInput {
  artistId: string;
  title: string;
  price: number | null;
  agreedPrice: number | null;
  commissionRatePct: number | null;
  status: CatalogueStatus;
  consignedDate: string | null;
}

function toCatalogueRow(input: Partial<CatalogueWorkInput>) {
  return {
    ...(input.artistId !== undefined && { artist_id: input.artistId }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.agreedPrice !== undefined && { agreed_price: input.agreedPrice }),
    ...(input.commissionRatePct !== undefined && { commission_rate: input.commissionRatePct == null ? null : input.commissionRatePct / 100 }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.consignedDate !== undefined && { consigned_at: input.consignedDate }),
  };
}

export async function createCatalogueWork(input: CatalogueWorkInput) {
  const supabase = await supabaseServer();
  const gallery = await getCurrentGallery(supabase);

  const { data, error } = await supabase
    .from("catalogue_works")
    .insert({
      gallery_id: gallery.id,
      artist_id: input.artistId,
      title: input.title,
      ...toCatalogueRow(input),
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateCatalogueWork(id: string, input: Partial<CatalogueWorkInput>) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("catalogue_works").update(toCatalogueRow(input)).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function updateCatalogueWorkStatus(id: string, status: CatalogueStatus) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("catalogue_works").update({ status }).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteCatalogueWork(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("catalogue_works").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

// ── Sales ────────────────────────────────────────────────────────────────

export interface RecordSaleInput {
  catalogueWorkId: string;
  salePriceCents: number;
  discountCents: number;
  commissionRatePct: number | null;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  soldDate: string;
  buyerPaidDate: string | null;
  payoutDueDate: string | null;
}

export async function recordSale(input: RecordSaleInput) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("record_sale", {
    p_catalogue_work_id: input.catalogueWorkId,
    p_sale_price_cents: input.salePriceCents,
    p_discount_cents: input.discountCents,
    p_commission_rate: input.commissionRatePct == null ? undefined : input.commissionRatePct / 100,
    p_buyer_name: input.buyerName ?? undefined,
    p_buyer_email: input.buyerEmail ?? undefined,
    p_buyer_phone: input.buyerPhone ?? undefined,
    p_sold_at: input.soldDate,
    p_buyer_paid_at: input.buyerPaidDate ?? undefined,
    p_payout_due_at: input.payoutDueDate ?? undefined,
  });
  if (error) throw error;

  const saleId = data as string;
  const noticeError = await sendNotice("send-sale-notice", { saleId });

  revalidatePath("/dashboard");
  return { id: saleId, noticeError };
}

export async function acceptSubmissionIntoCatalogue(submissionId: string) {
  const supabase = await supabaseServer();
  const gallery = await getCurrentGallery(supabase);

  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("title, price, artist_id, status")
    .eq("id", submissionId)
    .single();
  if (subError) throw subError;
  if (submission.status !== "approved") {
    throw new Error("Only approved submissions can be accepted into the catalogue.");
  }

  const { data, error } = await supabase
    .from("catalogue_works")
    .insert({
      gallery_id: gallery.id,
      artist_id: submission.artist_id,
      submission_id: submissionId,
      title: submission.title,
      price: submission.price,
      agreed_price: submission.price,
      commission_rate: gallery.commission_rate,
      consigned_at: new Date().toISOString().slice(0, 10),
      status: "available",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("This submission is already in the catalogue.");
    throw error;
  }

  revalidatePath("/dashboard");
  return { id: data.id };
}

// ── Payouts ──────────────────────────────────────────────────────────────

export interface MarkPayoutPaidInput {
  payoutId: string;
  paidDate: string;
  paymentReference: string | null;
  proofOfPayment: File | null;
}

export async function markPayoutPaid(input: MarkPayoutPaidInput) {
  const supabase = await supabaseServer();
  const gallery = await getCurrentGallery(supabase);

  let proofPath: string | null = null;
  if (input.proofOfPayment && input.proofOfPayment.size > 0) {
    proofPath = `${gallery.id}/${input.payoutId}/${input.proofOfPayment.name}`;
    const { error: uploadError } = await supabase.storage.from("payout-proofs").upload(proofPath, input.proofOfPayment, {
      contentType: input.proofOfPayment.type,
      upsert: true,
    });
    if (uploadError) throw uploadError;
  }

  const { error } = await supabase.rpc("mark_payout_paid", {
    p_payout_id: input.payoutId,
    p_paid_at: input.paidDate,
    p_payment_reference: input.paymentReference ?? undefined,
    p_proof_of_payment_path: proofPath ?? undefined,
  });
  if (error) throw error;

  const noticeError = await sendNotice("send-payout-notice", { payoutId: input.payoutId });

  revalidatePath("/dashboard");
  return { noticeError };
}

export async function acknowledgePayout(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("acknowledge_payout", { p_payout_id: id });
  if (error) throw error;
  revalidatePath("/studio");
}

export async function queryPayout(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("query_payout", { p_payout_id: id });
  if (error) throw error;
  revalidatePath("/studio");
}

export async function getPayoutProofSignedUrl(id: string) {
  const supabase = await supabaseServer();
  return getPayoutProofUrl(supabase, id);
}
