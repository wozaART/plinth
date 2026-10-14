// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { galleryConfig } from "@/test/gallery-config";
import { GalleryConfigProvider } from "@/lib/gallery-context";
import { submission } from "@/test/fixtures";

const h = vi.hoisted(() => ({ push: vi.fn(), signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push, refresh: vi.fn() }) }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: { signOut: h.signOut } }) }));
vi.mock("@/components/shared/ProfileDropdown", () => ({ default: () => <div>profile-dropdown</div> }));
vi.mock("@/components/shared/ProfileSwitcher", () => ({ default: () => <div>profile-switcher</div> }));
vi.mock("@/components/dashboard/SubmissionsPanel", () => ({ default: () => <div>submissions-panel</div> }));
vi.mock("@/components/dashboard/ExhibitionsPanel", () => ({ default: () => <div>exhibitions-panel</div> }));
vi.mock("@/components/dashboard/CataloguePanel", () => ({ default: () => <div>catalogue-panel</div> }));
vi.mock("@/components/dashboard/ContactsPanel", () => ({ default: () => <div>contacts-panel</div> }));
vi.mock("@/components/dashboard/FrameshopPanel", () => ({ default: () => <div>frameshop-panel</div> }));
vi.mock("@/components/dashboard/PayoutsPanel", () => ({ default: () => <div>payouts-panel</div> }));
vi.mock("@/components/dashboard/SettingsPanel", () => ({ default: () => <div>settings-panel</div> }));
vi.mock("@/components/dashboard/ActivityLogPanel", () => ({ default: () => <div>activity-panel</div> }));

import DashboardShell from "./DashboardShell";

const config = {
  ...galleryConfig,
  nav: {
    galleryTabs: [
      { id: "submissions", label: "Submissions", enabled: true },
      { id: "exhibitions", label: "Exhibitions", enabled: true },
      { id: "catalogue", label: "Catalogue", enabled: false },
      { id: "payouts", label: "Payouts", enabled: true },
    ],
    studioTabs: [],
  },
};

const baseProps = {
  submissions: [], exhibitions: [], exhibitionInvites: [], catalogue: [], catalogueArtists: [], contacts: [],
  frameJobs: [], payouts: [], auditLog: [], customDomain: null, domainStatus: "none",
};

const setup = (props: Partial<React.ComponentProps<typeof DashboardShell>> = {}) =>
  render(<GalleryConfigProvider value={config}><DashboardShell {...baseProps} {...props} /></GalleryConfigProvider>);

beforeEach(() => { h.push.mockReset(); h.signOut.mockReset().mockResolvedValue(undefined); });

describe("DashboardShell", () => {
  it("starts on submissions and shows the gallery identity", () => {
    setup();
    expect(screen.getByText("submissions-panel")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("submissions");
    expect(screen.getByText("Woza Art")).toBeTruthy();
  });

  it("only lists tabs the gallery has enabled", () => {
    setup();
    expect(screen.getByRole("button", { name: "Exhibitions" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Payouts" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Catalogue" })).toBeNull();
  });

  it("switches panels when a tab is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Exhibitions" }));
    expect(screen.getByText("exhibitions-panel")).toBeTruthy();
    expect(screen.queryByText("submissions-panel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Payouts" }));
    expect(screen.getByText("payouts-panel")).toBeTruthy();
  });

  it("opens settings and the activity log from the profile menu", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText("settings-panel")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Activity log/ }));
    expect(screen.getByText("activity-panel")).toBeTruthy();
  });

  it("counts pending submissions on the nav and offers a shortcut from other tabs", () => {
    setup({ submissions: [submission({ id: "s1", status: "pending" }), submission({ id: "s2", status: "pending" }), submission({ id: "s3", status: "approved" })] });
    expect(screen.getByRole("button", { name: /Submissions\s*2/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "2 pending review" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Exhibitions" }));
    fireEvent.click(screen.getByRole("button", { name: "2 pending review" }));
    expect(screen.getByText("submissions-panel")).toBeTruthy();
  });

  it("flags declined submissions awaiting acknowledgement", () => {
    setup({ submissions: [submission({ status: "declined", ack: false })] });
    expect(screen.getByText(/1 awaiting acknowledgement/)).toBeTruthy();
  });

  it("shows the profile dropdown only for artists who also own a gallery", () => {
    const { unmount } = setup();
    expect(screen.queryByText("profile-dropdown")).toBeNull();
    unmount();
    setup({ isArtist: true });
    expect(screen.getByText("profile-dropdown")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText("profile-switcher")).toBeTruthy();
  });

  it("opens the mobile navigation", () => {
    const { container } = setup();
    expect(container.querySelector(".dash-aside.open")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(container.querySelector(".dash-aside.open")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Payouts" }));
    expect(container.querySelector(".dash-aside.open")).toBeNull();
  });

  it("signs out and returns home", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/"));
    expect(h.signOut).toHaveBeenCalled();
  });
});
