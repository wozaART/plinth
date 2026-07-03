"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import type { SubmissionStatus } from "@/lib/types";

async function supabaseServer() {
  return createClient(await cookies());
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
  const { error } = await supabase.from("submissions").update({ ack: true }).eq("id", id);
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
  const exhibitionTitle = String(formData.get("exhibition") || "Open submissions");

  let exhibitionId: string | null = null;
  if (exhibitionTitle !== "Open submissions") {
    const { data: exhibition } = await supabase
      .from("exhibitions")
      .select("id")
      .eq("gallery_id", gallery.id)
      .eq("title", exhibitionTitle)
      .maybeSingle();
    exhibitionId = exhibition?.id ?? null;
  }

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
  });
  if (error) throw error;

  revalidatePath("/studio");
  return { id: submissionId, title };
}
