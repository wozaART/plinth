import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type {
  Submission,
  Exhibition,
  CatalogueWork,
  Contact,
  FrameJob,
  MyWork,
  OpenCall,
  StudioMessage,
} from "@/lib/types";
import { galleryConfig } from "@/lib/gallery.config";
import { relativeTime, shortDate } from "@/lib/utils";

type Client = SupabaseClient<Database>;

const { currencyFormat } = galleryConfig.business;

// ── Gallery-side reads ─────────────────────────────────────────────────

export async function getSubmissions(supabase: Client, galleryId: string): Promise<Submission[]> {
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
    price: currencyFormat(Number(s.price ?? 0)),
    forEx: s.exhibitions?.title ?? "Open submissions",
    date: relativeTime(s.created_at),
    status: s.status as Submission["status"],
    note: s.note,
    ack: s.ack ?? undefined,
    statement: s.statement ?? "",
  }));
}

export async function getExhibitionsWithCounts(supabase: Client, galleryId: string): Promise<Exhibition[]> {
  const [{ data: exhibitions, error: exError }, { data: counts, error: countError }] = await Promise.all([
    supabase.from("exhibitions").select("*").eq("gallery_id", galleryId).order("created_at", { ascending: true }),
    supabase.from("exhibition_counts").select("*"),
  ]);
  if (exError) throw exError;
  if (countError) throw countError;

  const countsById = new Map((counts ?? []).map((c) => [c.exhibition_id, c]));

  return (exhibitions ?? []).map((e) => {
    const c = countsById.get(e.id);
    return {
      title: e.title,
      dates: e.dates_label,
      status: e.status as Exhibition["status"],
      blurb: e.blurb ?? "",
      slots: e.slots,
      filled: c?.filled ?? 0,
      applicants: c?.applicants ?? 0,
    };
  });
}

export async function getCatalogue(supabase: Client, galleryId: string): Promise<CatalogueWork[]> {
  const { data, error } = await supabase
    .from("catalogue_works")
    .select("*, artist_profiles(full_name)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((w) => ({
    title: w.title,
    artist: w.artist_profiles?.full_name ?? "Unknown artist",
    price: currencyFormat(Number(w.price ?? 0)),
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

export async function getOpenCalls(supabase: Client, galleryId: string): Promise<OpenCall[]> {
  const { data, error } = await supabase
    .from("exhibitions")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((e) => ({
    title: e.title,
    gallery: galleryConfig.identity.name,
    deadline: e.submission_deadline ? shortDate(e.submission_deadline) : "Closed",
    focus: e.blurb ?? "",
    accepting: e.status === "open" || e.status === "planning",
  }));
}

export async function getMessages(supabase: Client, artistId: string, galleryId: string): Promise<StudioMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("artist_id", artistId)
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((m) => ({
    id: m.id,
    from: m.sender === "gallery" ? galleryConfig.identity.name : "You",
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
