import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  demoAuditLog, demoCatalogue, demoCatalogueArtists, demoContacts, demoExhibitionInvites,
  demoExhibitions, demoFrameJobs, demoPayouts, demoSubmissions,
} from "@/lib/demo-data";

// Public, non-functional preview of the gallery dashboard: static sample data,
// no sign-in, and nothing is saved.
export default function DemoGalleryPage() {
  return (
    <DashboardShell
      submissions={demoSubmissions}
      exhibitions={demoExhibitions}
      exhibitionInvites={demoExhibitionInvites}
      catalogue={demoCatalogue}
      catalogueArtists={demoCatalogueArtists}
      contacts={demoContacts}
      frameJobs={demoFrameJobs}
      payouts={demoPayouts}
      auditLog={demoAuditLog}
      customDomain={null}
      domainStatus="none"
    />
  );
}
