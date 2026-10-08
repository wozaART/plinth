import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { getSubmissions, getExhibitionsWithCounts, getExhibitionInvitesForGallery, getCatalogue, getGalleryArtists, getFrameJobs, getContacts, getPayouts, getAuditLog } from "@/lib/supabase/queries";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role === "artist") redirect("/signin");

  const gallery = await getCurrentGallery(supabase);

  const [submissions, exhibitions, exhibitionInvites, catalogue, catalogueArtists, contacts, frameJobs, payouts, auditLog] = await Promise.all([
    getSubmissions(supabase, gallery.id, gallery.currency_code),
    getExhibitionsWithCounts(supabase, gallery.id, true),
    getExhibitionInvitesForGallery(supabase, gallery.id),
    getCatalogue(supabase, gallery.id, gallery.currency_code),
    getGalleryArtists(supabase, gallery.id),
    getContacts(supabase, gallery.id),
    getFrameJobs(supabase, gallery.id),
    getPayouts(supabase, gallery.id, gallery.currency_code),
    getAuditLog(supabase, gallery.id),
  ]);

  return (
    <DashboardShell
      submissions={submissions}
      exhibitions={exhibitions}
      exhibitionInvites={exhibitionInvites}
      catalogue={catalogue}
      catalogueArtists={catalogueArtists}
      contacts={contacts}
      frameJobs={frameJobs}
      payouts={payouts}
      auditLog={auditLog}
      customDomain={gallery.custom_domain}
      domainStatus={gallery.domain_status}
    />
  );
}
