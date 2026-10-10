import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type {
  Submission,
  Exhibition,
  ExhibitionInvite,
  CatalogueWork,
  Contact,
  FrameJob,
  MyWork,
  OpenCall,
  StudioMessage,
  GalleryArtist,
  Sale,
  ArtistSale,
  Payout,
  ArtistPayout,
  AuditLogEntry,
  AuditAction,
  AuditChange,
} from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { relativeTime, shortDate } from "@/lib/utils";

type Client = SupabaseClient<Database>;

// ── Platform-owner reads (not gallery-scoped) ───────────────────────────

export interface ConsignmentTermsResponse {
  id: string;
  createdAt: string;
  galleryName: string;
  contactName: string;
  contactRole: string | null;
  contactEmail: string | null;
  status: string;
  answers: Record<string, string>;
  followups: { id: string; message: string; createdAt: string }[];
}

export async function getConsignmentTermsResponses(supabase: Client): Promise<ConsignmentTermsResponse[]> {
  const { data, error } = await supabase
    .from("consignment_terms_responses")
    .select("*, consignment_terms_followups(id, message, created_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    galleryName: r.gallery_name,
    contactName: r.contact_name,
    contactRole: r.contact_role,
    contactEmail: r.contact_email,
    status: r.status,
    answers: (r.answers ?? {}) as Record<string, string>,
    followups: (r.consignment_terms_followups ?? [])
      .map((f) => ({ id: f.id, message: f.message, createdAt: f.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

// ── Gallery-side reads ─────────────────────────────────────────────────

export async function getSubmissions(supabase: Client, galleryId: string, currencyCode: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*, artist_profiles(full_name), exhibitions(title)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist_profiles?.full_name ?? "Unknown artist",
    year: s.year ?? 0,
    medium: s.medium ?? "",
    dim: s.dim ?? "",
    price: formatCurrency(Number(s.price ?? 0), currencyCode),
    forEx: s.exhibitions?.title ?? "Open submissions",
    date: relativeTime(s.created_at),
    status: s.status as Submission["status"],
    note: s.note,
    ack: s.ack ?? undefined,
    rulesAck: s.rules_ack ?? undefined,
    statement: s.statement ?? "",
  }));
}

function exhibitionDatesLabel(e: { opening_date: string | null; closing_date: string | null; submission_deadline: string | null }): string {
  if (e.opening_date && e.closing_date) return `${shortDate(e.opening_date)} – ${shortDate(e.closing_date)}`;
  if (e.opening_date) return `Opens ${shortDate(e.opening_date)}`;
  if (e.closing_date) return `Closes ${shortDate(e.closing_date)}`;
  if (e.submission_deadline) return `Submissions close ${shortDate(e.submission_deadline)}`;
  return "Dates to be confirmed";
}

export async function getExhibitionsWithCounts(
  supabase: Client,
  galleryId: string,
  includeArchived = false,
): Promise<Exhibition[]> {
  let query = supabase.from("exhibitions").select("*").eq("gallery_id", galleryId).order("created_at", { ascending: true });
  if (!includeArchived) query = query.neq("status", "archived");

  const [{ data: exhibitions, error: exError }, { data: counts, error: countError }] = await Promise.all([
    query,
    supabase.from("exhibition_counts").select("*"),
  ]);
  if (exError) throw exError;
  if (countError) throw countError;

  const countsById = new Map((counts ?? []).map((c) => [c.exhibition_id, c]));

  return (exhibitions ?? []).map((e) => {
    const c = countsById.get(e.id);
    return {
      id: e.id,
      title: e.title,
      type: e.type as Exhibition["type"],
      status: e.status as Exhibition["status"],
      blurb: e.blurb ?? "",
      theme: e.theme ?? "",
      mediumRequirements: e.medium_requirements ?? "",
      sizeRequirements: e.size_requirements ?? "",
      rules: e.rules ?? "",
      slots: e.slots,
      filled: c?.filled ?? 0,
      applicants: c?.applicants ?? 0,
      submissionDeadline: e.submission_deadline,
      openingDate: e.opening_date,
      closingDate: e.closing_date,
      deliveryDate: e.delivery_date,
      dates: exhibitionDatesLabel(e),
    };
  });
}

export async function getExhibitionInvitesForGallery(supabase: Client, galleryId: string): Promise<ExhibitionInvite[]> {
  const { data, error } = await supabase
    .from("exhibition_invites")
    .select("*, exhibitions(title)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((i) => ({
    id: i.id,
    exhibitionId: i.exhibition_id,
    exhibitionTitle: i.exhibitions?.title ?? "",
    artistId: i.artist_id,
    email: i.email,
    fullName: i.full_name ?? "",
    message: i.message ?? "",
    status: i.status as ExhibitionInvite["status"],
    createdAt: i.created_at,
    expiresAt: i.expires_at,
    respondedAt: i.responded_at,
  }));
}

export async function getExhibitionInvitesForArtist(supabase: Client, artistId: string, artistEmail: string): Promise<ExhibitionInvite[]> {
  const { data, error } = await supabase
    .from("exhibition_invites")
    .select("*, exhibitions(title)")
    .or(`artist_id.eq.${artistId},email.ilike.${artistEmail}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((i) => ({
    id: i.id,
    exhibitionId: i.exhibition_id,
    exhibitionTitle: i.exhibitions?.title ?? "",
    artistId: i.artist_id,
    email: i.email,
    fullName: i.full_name ?? "",
    message: i.message ?? "",
    status: i.status as ExhibitionInvite["status"],
    createdAt: i.created_at,
    expiresAt: i.expires_at,
    respondedAt: i.responded_at,
  }));
}

type CatalogueRow = Database["public"]["Tables"]["catalogue_works"]["Row"] & {
  artist_profiles: { full_name: string | null } | null;
};

function mapCatalogueRow(w: CatalogueRow, currencyCode: string): CatalogueWork {
  return {
    id: w.id,
    title: w.title,
    artistId: w.artist_id,
    artist: w.artist_profiles?.full_name ?? "Unknown artist",
    price: w.price != null ? formatCurrency(Number(w.price), currencyCode) : "—",
    priceRaw: w.price,
    agreedPrice: w.agreed_price != null ? formatCurrency(Number(w.agreed_price), currencyCode) : "—",
    agreedPriceRaw: w.agreed_price,
    commissionRatePct: w.commission_rate != null ? Math.round(Number(w.commission_rate) * 100) : null,
    status: w.status as CatalogueWork["status"],
    consignedDate: w.consigned_at ? shortDate(w.consigned_at) : "—",
    consignedDateRaw: w.consigned_at,
    submissionId: w.submission_id,
  };
}

export async function getCatalogue(supabase: Client, galleryId: string, currencyCode: string): Promise<CatalogueWork[]> {
  const { data, error } = await supabase
    .from("catalogue_works")
    .select("*, artist_profiles(full_name)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((w) => mapCatalogueRow(w, currencyCode));
}

export async function getSales(supabase: Client, galleryId: string, currencyCode: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*, catalogue_works(title), artist_profiles(full_name)")
    .eq("gallery_id", galleryId)
    .order("sold_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    catalogueWorkId: s.catalogue_work_id,
    artistId: s.artist_id,
    artist: s.artist_profiles?.full_name ?? "Unknown artist",
    workTitle: s.catalogue_works?.title ?? "Untitled work",
    salePrice: formatCurrency(s.sale_price_cents / 100, currencyCode),
    salePriceCents: s.sale_price_cents,
    discountCents: s.discount_cents,
    commissionRatePct: Math.round(Number(s.commission_rate) * 100),
    commissionAmount: formatCurrency(s.commission_amount_cents / 100, currencyCode),
    artistAmount: formatCurrency(s.artist_amount_cents / 100, currencyCode),
    buyerName: s.buyer_name,
    buyerEmail: s.buyer_email,
    buyerPhone: s.buyer_phone,
    soldDate: shortDate(s.sold_at),
    soldDateRaw: s.sold_at,
    buyerPaidDate: s.buyer_paid_at ? shortDate(s.buyer_paid_at) : "—",
    buyerPaidDateRaw: s.buyer_paid_at,
    payoutDueDate: s.payout_due_at ? shortDate(s.payout_due_at) : "—",
    payoutDueDateRaw: s.payout_due_at,
  }));
}

export async function getPayouts(supabase: Client, galleryId: string, currencyCode: string): Promise<Payout[]> {
  const { data, error } = await supabase
    .from("payouts")
    .select("*, sales(payout_due_at, catalogue_works(title)), artist_profiles(full_name)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    saleId: p.sale_id,
    artistId: p.artist_id,
    artist: p.artist_profiles?.full_name ?? "Unknown artist",
    workTitle: p.sales?.catalogue_works?.title ?? "Untitled work",
    amount: formatCurrency(p.amount_cents / 100, currencyCode),
    amountCents: p.amount_cents,
    status: p.status as Payout["status"],
    dueDate: p.sales?.payout_due_at ? shortDate(p.sales.payout_due_at) : "—",
    dueDateRaw: p.sales?.payout_due_at ?? null,
    paidDate: p.paid_at ? shortDate(p.paid_at) : "—",
    paidDateRaw: p.paid_at,
    paymentReference: p.payment_reference,
    hasProofOfPayment: p.proof_of_payment_path != null,
    acknowledgedDate: p.acknowledged_at ? shortDate(p.acknowledged_at) : "—",
    acknowledgedDateRaw: p.acknowledged_at,
  }));
}

export async function getGalleryArtists(supabase: Client, galleryId: string): Promise<GalleryArtist[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("artist_id, artist_profiles(full_name)")
    .eq("gallery_id", galleryId);
  if (error) throw error;

  const seen = new Map<string, string>();
  for (const s of data ?? []) {
    if (!seen.has(s.artist_id)) seen.set(s.artist_id, s.artist_profiles?.full_name ?? "Unknown artist");
  }
  return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFrameJobs(supabase: Client, galleryId: string): Promise<FrameJob[]> {
  const { data, error } = await supabase
    .from("frame_jobs")
    .select("*, artist_profiles(full_name)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((f) => ({
    title: f.title,
    artist: f.artist_profiles?.full_name ?? "Unknown artist",
    spec: f.spec ?? "",
    stage: f.stage as FrameJob["stage"],
    due: f.due_date ? (f.stage === "ready" ? `Done · ${shortDate(f.due_date)}` : shortDate(f.due_date)) : "—",
  }));
}

export async function getContacts(supabase: Client, galleryId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("last_contact_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role as Contact["role"],
    focus: c.focus ?? "",
    last: c.last_contact_at ? relativeTime(c.last_contact_at) : "—",
  }));
}

const AUDIT_ENTITY_LABEL: Record<string, string> = {
  exhibitions: "Exhibition",
  contacts: "Contact",
  catalogue_works: "Artwork",
};

const AUDIT_HIDDEN_FIELDS = new Set(["id", "gallery_id", "created_at", "updated_at"]);

function auditFieldName(key: string): string {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function auditValue(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

function auditChanges(
  action: AuditAction,
  record: Record<string, unknown>,
  previous: Record<string, unknown> | null,
): AuditChange[] {
  const keys = Object.keys(record).filter((k) => !AUDIT_HIDDEN_FIELDS.has(k));
  if (action === "update") {
    if (!previous) return [];
    return keys
      .filter((k) => auditValue(previous[k]) !== auditValue(record[k]))
      .map((k) => ({ field: auditFieldName(k), from: auditValue(previous[k]), to: auditValue(record[k]) }));
  }
  const filled = keys.filter((k) => auditValue(record[k]) !== null);
  return filled.map((k) =>
    action === "insert"
      ? { field: auditFieldName(k), from: null, to: auditValue(record[k]) }
      : { field: auditFieldName(k), from: auditValue(record[k]), to: null },
  );
}

function auditRecordLabel(tableName: string, record: Record<string, unknown>): string {
  const field = tableName === "contacts" ? record.name : record.title;
  return typeof field === "string" && field.length > 0 ? field : "Untitled";
}

export async function getAuditLog(supabase: Client, galleryId: string, limit = 200): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = data ?? [];
  return rows.map((a, i) => {
    const record = (a.record ?? {}) as Record<string, unknown>;
    // Entries predating old_record fall back to the next-older entry for the same record.
    const older = rows.slice(i + 1).find((r) => r.record_id === a.record_id);
    const previous = (a.old_record ?? older?.record ?? null) as Record<string, unknown> | null;
    return {
      id: a.id,
      entity: AUDIT_ENTITY_LABEL[a.table_name] ?? a.table_name,
      action: a.action as AuditAction,
      recordId: a.record_id,
      label: auditRecordLabel(a.table_name, record),
      actorEmail: a.actor_email ?? "Unknown",
      when: relativeTime(a.created_at),
      whenRaw: a.created_at,
      changes: auditChanges(a.action as AuditAction, record, previous),
    };
  });
}

// ── Studio-side reads ───────────────────────────────────────────────────

export async function getArtistWorks(supabase: Client, artistId: string, galleryId: string): Promise<MyWork[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("artist_id", artistId)
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    year: s.year ?? 0,
    medium: s.medium ?? "",
    status: s.status as MyWork["status"],
    date: relativeTime(s.created_at),
    note: s.note || undefined,
    ack: s.ack ?? undefined,
  }));
}

export async function getArtistCatalogue(supabase: Client, artistId: string, galleryId: string, currencyCode: string): Promise<CatalogueWork[]> {
  const { data, error } = await supabase
    .from("catalogue_works")
    .select("*, artist_profiles(full_name)")
    .eq("artist_id", artistId)
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((w) => mapCatalogueRow(w, currencyCode));
}

export async function getArtistSales(supabase: Client, artistId: string, galleryId: string, currencyCode: string): Promise<ArtistSale[]> {
  const { data, error } = await supabase
    .from("artist_sales")
    .select("*")
    .eq("artist_id", artistId)
    .eq("gallery_id", galleryId)
    .order("sold_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id!,
    catalogueWorkId: s.catalogue_work_id!,
    salePrice: formatCurrency(s.sale_price_cents! / 100, currencyCode),
    commissionRatePct: Math.round(Number(s.commission_rate) * 100),
    commissionAmount: formatCurrency(s.commission_amount_cents! / 100, currencyCode),
    artistAmount: formatCurrency(s.artist_amount_cents! / 100, currencyCode),
    soldDate: shortDate(s.sold_at!),
    buyerPaidDate: s.buyer_paid_at ? shortDate(s.buyer_paid_at) : "—",
    payoutDueDate: s.payout_due_at ? shortDate(s.payout_due_at) : "—",
  }));
}

export async function getArtistPayouts(supabase: Client, artistId: string, galleryId: string, currencyCode: string): Promise<ArtistPayout[]> {
  const { data, error } = await supabase
    .from("payouts")
    .select("*, sales(payout_due_at, catalogue_works(title))")
    .eq("artist_id", artistId)
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    saleId: p.sale_id,
    workTitle: p.sales?.catalogue_works?.title ?? "Untitled work",
    amount: formatCurrency(p.amount_cents / 100, currencyCode),
    status: p.status as ArtistPayout["status"],
    dueDate: p.sales?.payout_due_at ? shortDate(p.sales.payout_due_at) : "—",
    paidDate: p.paid_at ? shortDate(p.paid_at) : "—",
    paymentReference: p.payment_reference,
    hasProofOfPayment: p.proof_of_payment_path != null,
  }));
}

export async function getOpenCalls(supabase: Client, galleryId: string, galleryName: string): Promise<OpenCall[]> {
  const { data, error } = await supabase
    .from("exhibitions")
    .select("*")
    .eq("gallery_id", galleryId)
    .neq("status", "archived")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    gallery: galleryName,
    type: e.type as OpenCall["type"],
    deadline: e.submission_deadline ? shortDate(e.submission_deadline) : "Closed",
    focus: e.blurb ?? "",
    theme: e.theme ?? "",
    mediumRequirements: e.medium_requirements ?? "",
    sizeRequirements: e.size_requirements ?? "",
    rules: e.rules ?? "",
    accepting: e.status === "open" || e.status === "planning",
  }));
}

export async function getMessages(supabase: Client, artistId: string, galleryId: string, galleryName: string): Promise<StudioMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("artist_id", artistId)
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((m) => ({
    id: m.id,
    from: m.sender === "gallery" ? galleryName : "You",
    time: relativeTime(m.created_at),
    preview: m.subject,
    body: m.body,
  }));
}

export type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"];

export async function getArtistProfile(supabase: Client, artistId: string): Promise<ArtistProfile | null> {
  const { data, error } = await supabase.from("artist_profiles").select("*").eq("id", artistId).single();
  if (error) return null;
  return data;
}

export type ArtistBankDetails = Database["public"]["Tables"]["artist_bank_details"]["Row"];

export async function getArtistBankDetails(supabase: Client, artistId: string): Promise<ArtistBankDetails | null> {
  const { data, error } = await supabase.from("artist_bank_details").select("*").eq("id", artistId).single();
  if (error) return null;
  return data;
}

export async function getPayoutProofUrl(supabase: Client, payoutId: string): Promise<string | null> {
  const { data: payout, error } = await supabase.from("payouts").select("proof_of_payment_path").eq("id", payoutId).single();
  if (error || !payout?.proof_of_payment_path) return null;

  const { data, error: signError } = await supabase.storage
    .from("payout-proofs")
    .createSignedUrl(payout.proof_of_payment_path, 60);
  if (signError) return null;
  return data.signedUrl;
}
