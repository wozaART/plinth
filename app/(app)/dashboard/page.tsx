import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { getSubmissions, getExhibitionsWithCounts, getExhibitionInvitesForGallery, getCatalogue, getFrameJobs, getContacts } from "@/lib/supabase/queries";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role === "artist") redirect("/signin");

  const gallery = await getCurrentGallery(supabase);

  const [submissions, exhibitions, exhibitionInvites, catalogue, contacts, frameJobs] = await Promise.all([
    getSubmissions(supabase, gallery.id, gallery.currency_code),
    getExhibitionsWithCounts(supabase, gallery.id, true),
    getExhibitionInvitesForGallery(supabase, gallery.id),
    getCatalogue(supabase, gallery.id, gallery.currency_code),
    getContacts(supabase, gallery.id),
    getFrameJobs(supabase, gallery.id),
  ]);

  return (
    <DashboardShell
      submissions={submissions}
      exhibitions={exhibitions}
      exhibitionInvites={exhibitionInvites}
      catalogue={catalogue}
      contacts={contacts}
      frameJobs={frameJobs}
      customDomain={gallery.custom_domain}
      domainStatus={gallery.domain_status}
    />
  );
}
