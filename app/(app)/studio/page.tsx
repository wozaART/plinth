import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { getArtistWorks, getArtistCatalogue, getArtistPayouts, getOpenCalls, getMessages, getArtistProfile, getArtistBankDetails, getExhibitionInvitesForArtist } from "@/lib/supabase/queries";
import StudioShell from "@/components/studio/StudioShell";

export default async function StudioPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Gate on the artist profile, not user_metadata.role: a gallery owner can
  // also be an artist under the same account.
  const { data: artistRow } = await supabase.from("artist_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!artistRow) redirect("/signin");

  const { data: ownedGallery } = await supabase.from("galleries").select("id").eq("owner_id", user.id).maybeSingle();

  const gallery = await getCurrentGallery(supabase);

  const [works, catalogueWorks, payouts, openCalls, messages, profile, bankDetails, exhibitionInvites] = await Promise.all([
    getArtistWorks(supabase, user.id, gallery.id),
    getArtistCatalogue(supabase, user.id, gallery.id, gallery.currency_code),
    getArtistPayouts(supabase, user.id, gallery.id, gallery.currency_code),
    getOpenCalls(supabase, gallery.id, gallery.name),
    getMessages(supabase, user.id, gallery.id, gallery.name),
    getArtistProfile(supabase, user.id),
    getArtistBankDetails(supabase, user.id),
    getExhibitionInvitesForArtist(supabase, user.id, user.email ?? ""),
  ]);

  const [firstName, ...rest] = (profile?.full_name ?? "Artist").split(" ");

  return (
    <StudioShell
      isGalleryOwner={!!ownedGallery}
      artistName={profile?.full_name ?? "Artist"}
      artistCity={profile?.city ?? ""}
      works={works}
      catalogueWorks={catalogueWorks}
      payouts={payouts}
      openCalls={openCalls}
      exhibitionInvites={exhibitionInvites}
      messages={messages}
      profile={{
        firstName,
        lastName: rest.join(" "),
        phone: profile?.phone ?? "",
        email: user.email ?? "",
        accountNumber: bankDetails?.bank_account_number ?? "",
        bankName: bankDetails?.bank_name ?? "",
        branchCode: bankDetails?.branch_code ?? "",
        accountType: bankDetails?.account_type ?? "Cheque",
      }}
    />
  );
}
