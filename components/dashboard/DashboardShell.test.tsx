// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { catalogueWork, submission } from "@/test/fixtures";
import { galleryConfig, renderWithGallery } from "@/test/gallery-config";
import type { GalleryRuntimeConfig } from "@/lib/gallery-runtime-config";

const push = vi.fn();
const signOut = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: { signOut } }) }));

// The panels have their own tests; here they just show which tab is mounted.
vi.mock("@/components/dashboard/SubmissionsPanel", () => ({
  default: ({ initialData, catalogueSubmissionIds }: { initialData: unknown[]; catalogueSubmissionIds: string[] }) => (
    <div>submissions panel ({initialData.length}) catalogued [{catalogueSubmissionIds.join(",")}]</div>
  ),
}));
vi.mock("@/components/dashboard/ExhibitionsPanel", () => ({ default: () => <div>exhibitions panel</div> }));
vi.mock("@/components/dashboard/CataloguePanel", () => ({ default: () => <div>catalogue panel</div> }));
vi.mock("@/components/dashboard/ContactsPanel", () => ({ default: () => <div>contacts panel</div> }));
vi.mock("@/components/dashboard/FrameshopPanel", () => ({ default: () => <div>frameshop panel</div> }));
vi.mock("@/components/dashboard/PayoutsPanel", () => ({ default: () => <div>payouts panel</div> }));
vi.mock("@/components/dashboard/SettingsPanel", () => ({
  default: ({ customDomain, domainStatus }: { customDomain: string | null; domainStatus: string }) => <div>settings panel {customDomain} {domainStatus}</div>,
}));
vi.mock("@/components/dashboard/ActivityLogPanel", () => ({ default: () => <div>activity panel</div> }));
vi.mock("@/components/shared/ProfileDropdown", () => ({ default: () => <div>profile dropdown</div> }));
vi.mock("@/components/shared/ProfileSwitcher", () => ({ default: () => <div>profile switcher</div> }));

import DashboardShell from "./DashboardShell";

const config = (over: Partial<GalleryRuntimeConfig> = {}): GalleryRuntimeConfig => ({
  ...galleryConfig,
  nav: {
    galleryTabs: [
      { id: "submissions", label: "Submissions", enabled: true },
      { id: "exhibitions", label: "Exhibitions", enabled: true },
      { id: "catalogue", label: "Catalogue", enabled: true },
      { id: "contacts", label: "Contacts", enabled: true },
      { id: "frameshop", label: "Frameshop", enabled: false },
      { id: "payouts", label: "Payouts", enabled: true },
    ],
    studioTabs: [],
  },
  ...over,
});

const base = {
  submissions: [], exhibitions: [], exhibitionInvites: [], catalogue: [], catalogueArtists: [], contacts: [],
  frameJobs: [], payouts: [], auditLog: [], customDomain: null, domainStatus: "none",
};

const show = (props: Partial<React.ComponentProps<typeof DashboardShell>> = {}, cfg = config()) =>
  renderWithGallery(<DashboardShell {...base} {...props} />, cfg);

beforeEach(() => {
  push.mockReset();
  signOut.mockReset().mockResolvedValue({});
});

describe("DashboardShell navigation", () => {
  it("opens on submissions and titles the page after the tab", () => {
    show();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("submissions");
    expect(screen.getByText(/submissions panel/)).toBeTruthy();
  });

  it("only lists tabs the gallery has enabled", () => {
    show();
    for (const name of ["Submissions", "Exhibitions", "Catalogue", "Contacts", "Payouts"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Frameshop" })).toBeNull();
  });

  it("switches panels when a tab is clicked", () => {
    show();
    const cases: [string, string][] = [
      ["Exhibitions", "exhibitions panel"],
      ["Catalogue", "catalogue panel"],
      ["Contacts", "contacts panel"],
      ["Payouts", "payouts panel"],
    ];
    for (const [tab, panel] of cases) {
      fireEvent.click(screen.getByRole("button", { name: tab }));
      expect(screen.getByText(panel)).toBeTruthy();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(tab.toLowerCase());
    }
    expect(screen.queryByText(/submissions panel/)).toBeNull();
  });

  it("mounts the frameshop panel when that tab is enabled", () => {
    const cfg = config();
    cfg.nav.galleryTabs.find((t) => t.id === "frameshop")!.enabled = true;
    show({}, cfg);
    fireEvent.click(screen.getByRole("button", { name: "Frameshop" }));
    expect(screen.getByText("frameshop panel")).toBeTruthy();
  });

  it("opens settings and the activity log from the profile section", () => {
    show({ customDomain: "art.example.com", domainStatus: "verified" });
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText("settings panel art.example.com verified")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Activity log/ }));
    expect(screen.getByText("activity panel")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("activity");
  });

  it("passes the ids of catalogued submissions to the submissions panel", () => {
    show({
      submissions: [submission()],
      catalogue: [catalogueWork({ submissionId: "sub1" }), catalogueWork({ id: "w2", submissionId: null })],
    });
    expect(screen.getByText("submissions panel (1) catalogued [sub1]")).toBeTruthy();
  });
});

describe("DashboardShell badges and banners", () => {
  it("counts pending submissions on the tab and links back from other tabs", () => {
    show({ submissions: [submission(), submission({ id: "s2" }), submission({ id: "s3", status: "approved" })] });
    expect(screen.getByRole("button", { name: /^Submissions\s*2$/ })).toBeTruthy();
    expect(screen.queryByText("2 pending review")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Contacts" }));
    fireEvent.click(screen.getByRole("button", { name: "2 pending review" }));
    expect(screen.getByText(/submissions panel/)).toBeTruthy();
  });

  it("shows no badge when nothing is pending", () => {
    show({ submissions: [submission({ status: "approved" })] });
    expect(screen.getByRole("button", { name: "Submissions" })).toBeTruthy();
  });

  it("flags declined submissions the artist hasn't acknowledged", () => {
    show({
      submissions: [
        submission({ id: "a", status: "declined", ack: false }),
        submission({ id: "b", status: "declined", ack: true }),
        submission({ id: "c", status: "declined" }),
      ],
    });
    expect(screen.getByText(/1 awaiting acknowledgement/)).toBeTruthy();
  });
});

describe("DashboardShell identity and mobile nav", () => {
  it("shows the gallery's name and city for gallery staff", () => {
    show();
    expect(screen.getByText("Woza Art")).toBeTruthy();
    expect(screen.getByText("Cape Town")).toBeTruthy();
    expect(screen.queryByText("profile dropdown")).toBeNull();
  });

  it("offers the gallery/artist profile dropdown to users who are also artists, and the switcher in settings", () => {
    show({ isArtist: true, artistName: "Ana" });
    expect(screen.getByText("profile dropdown")).toBeTruthy();
    expect(screen.queryByText("profile switcher")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText("profile switcher")).toBeTruthy();
  });

  it("uses the wordmark when the gallery has one", () => {
    show({}, config({ identity: { ...galleryConfig.identity, logoWordmark: { primary: "WOZA", secondary: "ART" } } }));
    expect(screen.getAllByText("WOZA").length).toBeGreaterThan(0);
    expect(screen.getByText("ART")).toBeTruthy();
  });

  it("opens the mobile nav and closes it again after choosing a tab", () => {
    const { container } = show();
    expect(container.querySelector(".dash-overlay")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(container.querySelector(".dash-aside.open")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Contacts" }));
    expect(container.querySelector(".dash-overlay")).toBeNull();
    expect(container.querySelector(".dash-aside.open")).toBeNull();
  });

  it("closes the mobile nav from the overlay", () => {
    const { container } = show();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(container.querySelector(".dash-overlay")!);
    expect(container.querySelector(".dash-overlay")).toBeNull();
  });
});

describe("DashboardShell sign out", () => {
  it("signs out of Supabase then returns to the home page", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
