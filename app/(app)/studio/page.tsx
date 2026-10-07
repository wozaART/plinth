import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { getArtistWorks, getOpenCalls, getMessages, getArtistProfile, getExhibitionInvitesForArtist } from "@/lib/supabase/queries";
import StudioShell from "@/components/studio/StudioShell";

export default async function StudioPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "artist") redirect("/signin");

  const gallery = await getCurrentGallery(supabase);

  const [works, openCalls, messages, profile, exhibitionInvites] = await Promise.all([
    getArtistWorks(supabase, user.id, gallery.id),
    getOpenCalls(supabase, gallery.id, gallery.name),
    getMessages(supabase, user.id, gallery.id, gallery.name),
    getArtistProfile(supabase, user.id),
    getExhibitionInvitesForArtist(supabase, user.id, user.email ?? ""),
  ]);

  const [firstName, ...rest] = (profile?.full_name ?? "Artist").split(" ");

  return (
    <StudioShell
      artistName={profile?.full_name ?? "Artist"}
      artistCity={profile?.city ?? ""}
      works={works}
      openCalls={openCalls}
      exhibitionInvites={exhibitionInvites}
      messages={messages}
      profile={{
        firstName,
        lastName: rest.join(" "),
        phone: profile?.phone ?? "",
        email: user.email ?? "",
        accountNumber: profile?.bank_account_number ?? "",
        bankName: profile?.bank_name ?? "",
        branchCode: profile?.branch_code ?? "",
        accountType: profile?.account_type ?? "Cheque",
      }}
    />
  );
}
