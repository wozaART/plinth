import StudioShell from "@/components/studio/StudioShell";
import {
  demoArtistPayouts, demoArtistProfile, demoCatalogue, demoExhibitionInvites, demoMessages, demoOpenCalls, demoWorks,
} from "@/lib/demo-data";

// Public, non-functional preview of the artist studio: static sample data,
// no sign-in, and nothing is saved.
export default function DemoArtistPage() {
  return (
    <StudioShell
      artistName="Lerato Dlamini"
      artistCity="Cape Town"
      works={demoWorks}
      catalogueWorks={demoCatalogue.slice(0, 1)}
      payouts={demoArtistPayouts}
      openCalls={demoOpenCalls}
      exhibitionInvites={demoExhibitionInvites}
      messages={demoMessages}
      profile={demoArtistProfile}
    />
  );
}
