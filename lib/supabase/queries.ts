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
} from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { relativeTime, shortDate } from "@/lib/utils";

type Client = SupabaseClient<Database>;

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

export async function getCatalogue(supabase: Client, galleryId: string, currencyCode: string): Promise<CatalogueWork[]> {
  const { data, error } = await supabase
    .from("catalogue_works")
    .select("*, artist_profiles(full_name)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((w) => ({
    title: w.title,
    artist: w.artist_profiles?.full_name ?? "Unknown artist",
    price: formatCurrency(Number(w.price ?? 0), currencyCode),
    status: w.status as CatalogueWork["status"],
  }));
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
