// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { galleryConfig } from "@/test/gallery-config";
import { GalleryConfigProvider } from "@/lib/gallery-context";
import { emptyPublicProfile } from "@/lib/artist-profile";
import type { ArtistPayout, MyWork, OpenCall } from "@/lib/types";

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
  getConsignmentTermsSignedUrl: vi.fn(),
  updateArtistProfile: vi.fn(),
  saveArtistAbout: vi.fn(),
  addPortfolioWork: vi.fn(),
  updatePortfolioWork: vi.fn(),
  deletePortfolioWork: vi.fn(),
  addArtistPhoto: vi.fn(),
  deleteArtistPhoto: vi.fn(),
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
      { id: "open-calls", label: "Open calls", enabled: true },
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
  publicProfile: emptyPublicProfile("a1", "Thandiwe Mokoena"),
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

describe("StudioShell consignment terms", () => {
  const call = (over: Partial<OpenCall> = {}): OpenCall => ({
    id: "oc1", title: "Highveld Light", gallery: "Gallery", type: "group", access: "open", deadline: "30 Jan", focus: "",
    theme: "", mediumRequirements: "", sizeRequirements: "", rules: "", consignmentTermsText: "", consignmentTermsPdfPath: null,
    maxWorksPerArtist: null, commissionRatePct: null, myWorkCount: 0, accepting: true, ...over,
  });

  // Walks the submit drawer to its last step.
  function reachStatementStep() {
    fireEvent.click(screen.getByRole("button", { name: "My work" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit work" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.change(screen.getByPlaceholderText("Work title"), { target: { value: "Dusk" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Oil on canvas"), { target: { value: "Oil" } });
    fireEvent.change(screen.getByPlaceholderText("2024"), { target: { value: "2025" } });
    const file = new File(["x"], "w.png", { type: "image/png" });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 80"), { target: { value: "80" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 4"), { target: { value: "4" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. R 18 000"), { target: { value: "R 5000" } });
    fireEvent.click(screen.getByRole("button", { name: /Review/ }));
  }

  it("blocks submitting until the artist agrees to typed terms", () => {
    setup({ openCalls: [call({ consignmentTermsText: "Commission is 40%." })] });
    reachStatementStep();
    expect(screen.getByText("Commission is 40%.")).toBeTruthy();
    const submit = screen.getByRole("button", { name: "Submit for review" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/agree to the consignment terms/));
    expect(submit.disabled).toBe(false);
  });

  it("offers a PDF button instead of text when the terms are a PDF", () => {
    setup({ openCalls: [call({ consignmentTermsPdfPath: "g/e/1.pdf" })] });
    reachStatementStep();
    expect(screen.getAllByRole("button", { name: /Open consignment terms/ }).length).toBeGreaterThan(0);
    expect((screen.getByRole("button", { name: "Submit for review" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("asks for no agreement when the exhibition has no terms", () => {
    setup({ openCalls: [call()] });
    reachStatementStep();
    expect(screen.queryByLabelText(/agree to the consignment terms/)).toBeNull();
    expect((screen.getByRole("button", { name: "Submit for review" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("asks the artist to accept rules and terms in a modal before opening the submit drawer", () => {
    setup({ openCalls: [call({ rules: "Max 3 works.", consignmentTermsText: "Commission is 40%." })] });
    fireEvent.click(screen.getByRole("button", { name: "Open calls" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit for this call" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Max 3 works.");
    expect(dialog.textContent).toContain("Commission is 40%.");
    expect(screen.queryByPlaceholderText("Work title")).toBeNull();
    expect(screen.queryByText(/How many works/)).toBeNull();
    const accept = screen.getByRole("button", { name: /Accept & continue/ }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(accept);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/How many works are you submitting/)).toBeTruthy();
  });

  it("caps the work count at what the artist has left for the exhibition", () => {
    setup({ openCalls: [call({ maxWorksPerArtist: 3, myWorkCount: 2 })] });
    fireEvent.click(screen.getByRole("button", { name: "My work" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit work" }));
    expect(screen.getByText(/you can add 1 more/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "More works" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("blocks submitting once the artist has reached the exhibition's limit", () => {
    setup({ openCalls: [call({ maxWorksPerArtist: 2, myWorkCount: 2 })] });
    fireEvent.click(screen.getByRole("button", { name: "My work" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit work" }));
    expect(screen.getByText(/already submitted the maximum of 2 works/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Continue/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("uses the exhibition's own commission in the sale-price note", () => {
    setup({ openCalls: [call({ commissionRatePct: 25 })] });
    fireEvent.click(screen.getByRole("button", { name: "My work" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit work" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.change(screen.getByPlaceholderText("e.g. R 18 000"), { target: { value: "1000" } });
    expect(screen.getByText("Gallery keeps 25%")).toBeTruthy();
    expect(document.body.textContent).toMatch(/R\s?1\s?250/);
  });

  it("asks how many works first, then one form per work", () => {
    setup({ openCalls: [call()] });
    fireEvent.click(screen.getByRole("button", { name: "My work" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit work" }));
    fireEvent.click(screen.getByRole("button", { name: "More works" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText(/Work 1 of 2/)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Work title"), { target: { value: "Dusk" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Oil on canvas"), { target: { value: "Oil" } });
    fireEvent.change(screen.getByPlaceholderText("2024"), { target: { value: "2025" } });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(["x"], "w.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 80"), { target: { value: "80" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 60"), { target: { value: "60" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 4"), { target: { value: "4" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. R 18 000"), { target: { value: "R 5000" } });
    fireEvent.click(screen.getByRole("button", { name: /Next work/ }));
    expect(screen.getByText(/Work 2 of 2/)).toBeTruthy();
    // Medium and year carry over from the previous work.
    expect((screen.getByPlaceholderText("e.g. Oil on canvas") as HTMLInputElement).value).toBe("Oil");
    expect((screen.getByPlaceholderText("Work title") as HTMLInputElement).value).toBe("");
  });
});
