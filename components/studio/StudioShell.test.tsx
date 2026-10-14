// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { galleryConfig } from "@/test/gallery-config";
import { GalleryConfigProvider } from "@/lib/gallery-context";
import type { ArtistPayout, MyWork } from "@/lib/types";

const h = vi.hoisted(() => ({
  push: vi.fn(),
  signOut: vi.fn(),
  ackDeclinedSubmission: vi.fn(),
  acknowledgePayout: vi.fn(),
  queryPayout: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push, refresh: vi.fn() }) }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: { signOut: h.signOut } }) }));
vi.mock("@/lib/supabase/actions", () => ({
  ackDeclinedSubmission: h.ackDeclinedSubmission,
  acknowledgePayout: h.acknowledgePayout,
  queryPayout: h.queryPayout,
  createSubmission: vi.fn(),
  updateSubmission: vi.fn(),
  respondToExhibitionInvite: vi.fn(),
  getPayoutProofSignedUrl: vi.fn(),
  updateArtistProfile: vi.fn(),
}));
vi.mock("@/components/shared/ProfileDropdown", () => ({ default: () => <div>profile-dropdown</div> }));
vi.mock("@/components/shared/ProfileSwitcher", () => ({ default: () => <div>profile-switcher</div> }));

import StudioShell from "./StudioShell";

const config = {
  ...galleryConfig,
  nav: {
    galleryTabs: [],
    studioTabs: [
      { id: "overview", label: "Overview", enabled: true },
      { id: "submissions", label: "My work", enabled: true },
      { id: "earnings", label: "Earnings", enabled: false },
      { id: "messages", label: "Messages", enabled: true },
    ],
  },
};

const work = (over: Partial<MyWork> = {}): MyWork => ({ id: "w1", title: "Harbour at Dusk", year: 2025, medium: "Oil on canvas", status: "pending", date: "1 Mar", ...over });
const payout = (over: Partial<ArtistPayout> = {}): ArtistPayout => ({
  id: "p1", saleId: "s1", workTitle: "Harbour at Dusk", amount: "R 11 700", status: "due",
  dueDate: "1 Apr", paidDate: "", paymentReference: null, hasProofOfPayment: false, ...over,
});

const baseProps = {
  artistName: "Thandiwe Mokoena", artistCity: "Durban", works: [], catalogueWorks: [], payouts: [], openCalls: [],
  exhibitionInvites: [], messages: [],
  profile: { firstName: "Thandiwe", lastName: "Mokoena", phone: "", email: "t@m.co", accountNumber: "", bankName: "", branchCode: "", accountType: "" },
};

const setup = (props: Partial<React.ComponentProps<typeof StudioShell>> = {}) =>
  render(<GalleryConfigProvider value={config}><StudioShell {...baseProps} {...props} /></GalleryConfigProvider>);

beforeEach(() => {
  h.push.mockReset();
  h.signOut.mockReset().mockResolvedValue(undefined);
  for (const fn of [h.ackDeclinedSubmission, h.acknowledgePayout, h.queryPayout]) fn.mockReset().mockResolvedValue(undefined);
});

describe("StudioShell", () => {
  it("opens on the overview with the artist's identity and counts", () => {
    setup({ works: [work({ status: "approved" }), work({ id: "w2", title: "Second", status: "pending" }), work({ id: "w3", title: "Third", status: "pending" })] });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("overview");
    expect(screen.getAllByText("Thandiwe Mokoena").length).toBeGreaterThan(0);
    const stat = (label: string) => screen.getAllByText(label).find((el) => el.previousElementSibling)!.previousElementSibling!.textContent;
    expect(stat("Submitted")).toBe("3");
    expect(stat("Approved")).toBe("1");
    expect(stat("Pending")).toBe("2");
  });

  it("lists only the studio tabs the gallery enables", () => {
    setup();
    expect(screen.getByRole("button", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "My work" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Messages" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Earnings" })).toBeNull();
  });

  it("switches tabs and updates the heading", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "My work" }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("submissions");
    expect(screen.getByRole("button", { name: "Submit work" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("settings");
    expect(screen.queryByRole("button", { name: "Submit work" })).toBeNull();
  });

  it("jumps to submissions from 'View all'", () => {
    setup({ works: [work()] });
    fireEvent.click(screen.getByRole("button", { name: /View all/ }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("submissions");
  });

  it("shows the profile dropdown only for artists who also run a gallery", () => {
    const { unmount } = setup();
    expect(screen.queryByText("profile-dropdown")).toBeNull();
    unmount();
    setup({ isGalleryOwner: true });
    expect(screen.getByText("profile-dropdown")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText("profile-switcher")).toBeTruthy();
  });

  it("opens the mobile navigation and closes it after choosing a tab", () => {
    const { container } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(container.querySelector(".dash-aside.open")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Messages" }));
    expect(container.querySelector(".dash-aside.open")).toBeNull();
  });

  it("signs out and returns home", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/"));
  });
});

describe("StudioShell attention banners", () => {
  it("makes the artist acknowledge a declined decision", () => {
    setup({ works: [work({ status: "declined", ack: false, note: "Not a fit for this season." })] });
    expect(screen.getByText("A decision is waiting for Harbour at Dusk")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Read the full message/ }));
    fireEvent.click(screen.getByRole("button", { name: /I understand/ }));
    expect(h.ackDeclinedSubmission).toHaveBeenCalledWith("w1");
    expect(screen.queryByText("A decision is waiting for Harbour at Dusk")).toBeNull();
    expect(screen.getByText("Decision acknowledged.")).toBeTruthy();
  });

  it("does not nag about declines that were already acknowledged", () => {
    setup({ works: [work({ status: "declined", ack: true })] });
    expect(screen.queryByText(/A decision is waiting/)).toBeNull();
  });

  it("asks the artist to confirm a paid payout", () => {
    setup({ payouts: [payout({ status: "paid", paymentReference: "EFT-42" })] });
    expect(screen.getByText(/A payout of R 11 700/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Review this payout/ }));
    expect(screen.getByText("Reference: EFT-42")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /received this payment/ }));
    expect(h.acknowledgePayout).toHaveBeenCalledWith("p1");
    expect(screen.queryByText(/A payout of/)).toBeNull();
    expect(screen.getByText("Payout acknowledged.")).toBeTruthy();
  });

  it("lets the artist query a payout", () => {
    setup({ payouts: [payout({ status: "paid" })] });
    fireEvent.click(screen.getByRole("button", { name: /Review this payout/ }));
    fireEvent.click(screen.getByRole("button", { name: /not right/ }));
    expect(h.queryPayout).toHaveBeenCalledWith("p1");
    expect(screen.getByText(/flagged this payout/)).toBeTruthy();
  });

  it("ignores payouts that are still due", () => {
    setup({ payouts: [payout({ status: "due" })] });
    expect(screen.queryByText(/A payout of/)).toBeNull();
  });
});
