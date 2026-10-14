// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { galleryConfig, renderWithGallery } from "@/test/gallery-config";
import type { GalleryRuntimeConfig } from "@/lib/gallery-runtime-config";
import type { ArtistPayout, CatalogueWork, ExhibitionInvite, MyWork, OpenCall, StudioMessage } from "@/lib/types";
import { catalogueWork } from "@/test/fixtures";

const h = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  upload: vi.fn(),
  ackDeclinedSubmission: vi.fn(),
  createSubmission: vi.fn(),
  updateSubmission: vi.fn(),
  respondToExhibitionInvite: vi.fn(),
  acknowledgePayout: vi.fn(),
  queryPayout: vi.fn(),
  getPayoutProofSignedUrl: vi.fn(),
  updateArtistProfile: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push, refresh: h.refresh }) }));
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: h.signOut, getUser: h.getUser }, storage: { from: () => ({ upload: h.upload }) } }),
}));
vi.mock("@/lib/supabase/actions", () => ({
  ackDeclinedSubmission: h.ackDeclinedSubmission,
  createSubmission: h.createSubmission,
  updateSubmission: h.updateSubmission,
  respondToExhibitionInvite: h.respondToExhibitionInvite,
  acknowledgePayout: h.acknowledgePayout,
  queryPayout: h.queryPayout,
  getPayoutProofSignedUrl: h.getPayoutProofSignedUrl,
  updateArtistProfile: h.updateArtistProfile,
}));
vi.mock("@/components/shared/ProfileDropdown", () => ({ default: () => <div>profile dropdown</div> }));
vi.mock("@/components/shared/ProfileSwitcher", () => ({ default: () => <div>profile switcher</div> }));

import StudioShell from "./StudioShell";

const work = (over: Partial<MyWork> = {}): MyWork => ({
  id: "w1", title: "Salt Pan", year: 2025, medium: "Oil on canvas", status: "pending", date: "1 Mar",
  dim: "90 × 120 × 4 cm", price: 24000, ...over,
});
const declined = (over: Partial<MyWork> = {}) =>
  work({ id: "d1", title: "Dune", status: "declined", ack: false, note: "Not a fit for the current programme because the palette is too close to another work.", ...over });
const openCall = (over: Partial<OpenCall> = {}): OpenCall => ({
  id: "oc1", title: "Highveld Light", gallery: "Woza Art", type: "group", deadline: "30 Jun", focus: "Landscape", theme: "Light",
  mediumRequirements: "", sizeRequirements: "", rules: "", accepting: true, ...over,
});
const invite = (over: Partial<ExhibitionInvite> = {}): ExhibitionInvite => ({
  id: "i1", exhibitionId: "e1", exhibitionTitle: "Group Show", artistId: "a1", email: "a@x.co", fullName: "Ana",
  message: "Please join", status: "pending", createdAt: "", expiresAt: "", respondedAt: null, ...over,
});
const artistPayout = (over: Partial<ArtistPayout> = {}): ArtistPayout => ({
  id: "p1", saleId: "s1", workTitle: "Harbour", amount: "R 9 000", status: "due", dueDate: "1 Jan", paidDate: "2 Jan",
  paymentReference: null, hasProofOfPayment: false, ...over,
});
const message = (over: Partial<StudioMessage> = {}): StudioMessage => ({ id: "m1", from: "Curator", time: "Today", preview: "Welcome", body: "Glad to have you", ...over });

const profile = { firstName: "Ana", lastName: "Artist", phone: "082", email: "ana@x.co", accountNumber: "12345", bankName: "FNB", branchCode: "250655", accountType: "Cheque" };

const config: GalleryRuntimeConfig = {
  ...galleryConfig,
  nav: {
    galleryTabs: [],
    studioTabs: [
      { id: "overview", label: "Overview", enabled: true },
      { id: "submissions", label: "Submissions", enabled: true },
      { id: "open-calls", label: "Open calls", enabled: true },
      { id: "invitations", label: "Invitations", enabled: true },
      { id: "messages", label: "Messages", enabled: true },
      { id: "profile", label: "Profile", enabled: true },
      { id: "catalogue", label: "Catalogue", enabled: false },
      { id: "earnings", label: "Earnings", enabled: true },
    ],
  },
};

type Props = React.ComponentProps<typeof StudioShell>;
const baseProps: Props = {
  artistName: "Ana Artist", artistCity: "Cape Town", works: [], catalogueWorks: [] as CatalogueWork[], payouts: [], openCalls: [],
  exhibitionInvites: [], messages: [], profile,
};
const show = (props: Partial<Props> = {}, cfg = config) => renderWithGallery(<StudioShell {...baseProps} {...props} />, cfg);
const tab = (name: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
const heading = () => screen.getByRole("heading", { level: 1 }).textContent;

beforeEach(() => {
  for (const f of Object.values(h)) f.mockReset();
  h.signOut.mockResolvedValue({});
  h.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  h.upload.mockResolvedValue({ error: null });
  h.createSubmission.mockResolvedValue({ title: "New Work" });
  h.updateSubmission.mockResolvedValue({ title: "Salt Pan II" });
  h.respondToExhibitionInvite.mockResolvedValue(undefined);
  h.updateArtistProfile.mockResolvedValue(undefined);
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

describe("StudioShell tabs", () => {
  it("opens on overview and only lists enabled tabs", () => {
    show();
    expect(heading()).toBe("overview");
    for (const name of ["Overview", "Submissions", "Open calls", "Invitations", "Messages", "Profile", "Earnings"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${name}`) })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Catalogue" })).toBeNull();
  });

  it("titles each tab and shows the right content", () => {
    show({ works: [work()], openCalls: [openCall()], messages: [message()], exhibitionInvites: [invite()] });
    tab("Submissions");
    expect(heading()).toBe("submissions");
    expect(screen.getByText("Salt Pan")).toBeTruthy();
    tab("Open calls");
    expect(heading()).toBe("Open calls");
    expect(screen.getByText("Highveld Light")).toBeTruthy();
    tab("Invitations");
    expect(screen.getByText("Group Show")).toBeTruthy();
    tab("Messages");
    expect(screen.getByText("Glad to have you")).toBeTruthy();
    tab("Profile");
    expect(screen.getByText("Personal details")).toBeTruthy();
    tab("Earnings");
    expect(screen.getByText(/No payouts yet/)).toBeTruthy();
  });

  it("shows the catalogue tab once the gallery enables it", () => {
    const cfg = structuredClone(config);
    cfg.nav.studioTabs.find((t) => t.id === "catalogue")!.enabled = true;
    show({ catalogueWorks: [catalogueWork({ title: "Harbour at Dusk" })] }, cfg);
    tab("Catalogue");
    expect(screen.getByText("Harbour at Dusk")).toBeTruthy();
    expect(screen.getByText("available")).toBeTruthy();
  });

  it("explains an empty catalogue", () => {
    const cfg = structuredClone(config);
    cfg.nav.studioTabs.find((t) => t.id === "catalogue")!.enabled = true;
    show({}, cfg);
    tab("Catalogue");
    expect(screen.getByText(/Nothing in the gallery/)).toBeTruthy();
  });

  it("shows the artist card for artists, the profile dropdown for gallery owners", () => {
    const { unmount } = show();
    expect(screen.getByText("Ana Artist")).toBeTruthy();
    expect(screen.getByText("Cape Town")).toBeTruthy();
    expect(screen.queryByText("profile dropdown")).toBeNull();
    unmount();
    show({ isGalleryOwner: true });
    expect(screen.getByText("profile dropdown")).toBeTruthy();
  });

  it("settings explains there is nothing to manage, or offers the profile switcher to gallery owners", () => {
    const { unmount } = show();
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText(/No settings to manage yet/)).toBeTruthy();
    unmount();
    show({ isGalleryOwner: true });
    fireEvent.click(screen.getByRole("button", { name: /Settings/ }));
    expect(screen.getByText("profile switcher")).toBeTruthy();
  });

  it("opens and closes the mobile nav, closing it after choosing a tab", () => {
    const { container } = show();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(container.querySelector(".dash-aside.open")).not.toBeNull();
    tab("Messages");
    expect(container.querySelector(".dash-aside.open")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(container.querySelector(".dash-overlay")!);
    expect(container.querySelector(".dash-overlay")).toBeNull();
  });

  it("signs out and returns home", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /Sign out/ }));
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/"));
    expect(h.signOut).toHaveBeenCalled();
  });
});

describe("StudioShell overview", () => {
  it("counts submissions, approvals, pending work and accepting open calls", () => {
    show({
      works: [work(), work({ id: "w2", status: "approved" }), work({ id: "w3", status: "approved" })],
      openCalls: [openCall(), openCall({ id: "oc2", accepting: false })],
    });
    const stat = (label: string) => screen.getByText(label, { selector: "div" }).previousElementSibling!.textContent;
    expect(stat("Submitted")).toBe("3");
    expect(stat("Approved")).toBe("2");
    expect(stat("Pending")).toBe("1");
    expect(stat("Open calls")).toBe("1");
  });

  it("lists only the three most recent works and links to all submissions", () => {
    show({ works: ["A", "B", "C", "D"].map((t, i) => work({ id: `w${i}`, title: `Work ${t}` })) });
    expect(screen.queryByText("Work D")).toBeNull();
    expect(screen.getByText("Work C")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View all →" }));
    expect(heading()).toBe("submissions");
    expect(screen.getByText("Work D")).toBeTruthy();
  });
});

describe("StudioShell declined-work acknowledgement", () => {
  it("blocks the overview with a banner until the artist reads the decision", () => {
    show({ works: [declined()] });
    expect(screen.getByText("A decision is waiting for Dune")).toBeTruthy();
    expect(screen.getByText("⏳ Unread")).toBeTruthy();
    // Collapsed: the message is truncated and the ack button hidden.
    expect(screen.queryByRole("button", { name: /I understand/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Read the full message →" }));
    expect(screen.getByText(/will not be delivered to the gallery/)).toBeTruthy();
  });

  it("acknowledging clears the banner, tells the artist and records it on the server", () => {
    show({ works: [declined()] });
    fireEvent.click(screen.getByRole("button", { name: "Read the full message →" }));
    fireEvent.click(screen.getByRole("button", { name: /I understand/ }));
    expect(h.ackDeclinedSubmission).toHaveBeenCalledWith("d1");
    expect(screen.getByText("Decision acknowledged.")).toBeTruthy();
    expect(screen.queryByText("A decision is waiting for Dune")).toBeNull();
    expect(screen.queryByText("⏳ Unread")).toBeNull();
  });

  it("shows no banner for already-acknowledged declines", () => {
    show({ works: [declined({ ack: true })] });
    expect(screen.queryByText(/A decision is waiting/)).toBeNull();
  });

  it("repeats the banner and an inline acknowledge button on the submissions tab", () => {
    show({ works: [declined()] });
    tab("Submissions");
    expect(screen.getByText("A decision is waiting for Dune")).toBeTruthy();
    expect(screen.getByText("Gallery note")).toBeTruthy();
    const inline = screen.getAllByRole("button", { name: /I understand/ });
    expect(inline).toHaveLength(1);
    fireEvent.click(inline[0]);
    expect(h.ackDeclinedSubmission).toHaveBeenCalledWith("d1");
    expect(screen.queryByText("A decision is waiting for Dune")).toBeNull();
    expect(screen.queryByRole("button", { name: /I understand/ })).toBeNull();
  });
});

describe("StudioShell payout acknowledgement", () => {
  const paid = artistPayout({ status: "paid", paymentReference: "REF-1" });

  it("shows a banner on the overview for a paid payout, expanding to the two responses", () => {
    show({ payouts: [paid] });
    expect(screen.getByText(/A payout of R 9 000/)).toBeTruthy();
    expect(screen.getByText("Reference: REF-1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /received this payment/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Review this payout →" }));
    expect(screen.getByRole("button", { name: /received this payment/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /not right/ })).toBeTruthy();
  });

  it("asks for confirmation when there is no reference", () => {
    show({ payouts: [{ ...paid, paymentReference: null }] });
    expect(screen.getByText(/confirm you've received this payment/)).toBeTruthy();
  });

  it("confirming receipt clears the banner and records it", () => {
    show({ payouts: [paid] });
    fireEvent.click(screen.getByRole("button", { name: "Review this payout →" }));
    fireEvent.click(screen.getByRole("button", { name: /received this payment/ }));
    expect(h.acknowledgePayout).toHaveBeenCalledWith("p1");
    expect(screen.getByText("Payout acknowledged.")).toBeTruthy();
    expect(screen.queryByText(/A payout of/)).toBeNull();
  });

  it("querying flags the payout for the gallery", () => {
    show({ payouts: [paid] });
    fireEvent.click(screen.getByRole("button", { name: "Review this payout →" }));
    fireEvent.click(screen.getByRole("button", { name: /not right/ }));
    expect(h.queryPayout).toHaveBeenCalledWith("p1");
    expect(screen.getByText(/flagged this payout/)).toBeTruthy();
    tab("Earnings");
    expect(screen.getByText("Queried")).toBeTruthy();
  });

  it("does not nag for payouts that are only due or already acknowledged", () => {
    show({ payouts: [artistPayout(), artistPayout({ id: "p2", status: "acknowledged" })] });
    expect(screen.queryByText(/A payout of/)).toBeNull();
  });

  it("lists earnings with their status and only offers actions on paid payouts", () => {
    show({ payouts: [artistPayout(), { ...paid, id: "p2", workTitle: "Paid One" }] });
    tab("Earnings");
    expect(screen.getByText("Harbour")).toBeTruthy();
    expect(screen.getAllByText(/R 9 000 · Due 1 Jan/)).toHaveLength(2);
    expect(screen.getByText(/Ref REF-1/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /I've received this$/ })).toHaveLength(1);
  });

  it("acknowledges from the earnings list", () => {
    show({ payouts: [{ ...paid, id: "p9", workTitle: "Paid One" }] });
    tab("Earnings");
    fireEvent.click(screen.getByRole("button", { name: "I've received this" }));
    expect(h.acknowledgePayout).toHaveBeenCalledWith("p9");
    expect(screen.queryByRole("button", { name: "I've received this" })).toBeNull();
  });

  it("opens proof of payment in a new tab when one exists", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    h.getPayoutProofSignedUrl.mockResolvedValue("https://signed.test/proof");
    show({ payouts: [artistPayout({ status: "acknowledged", hasProofOfPayment: true })] });
    tab("Earnings");
    fireEvent.click(screen.getByRole("button", { name: "View proof of payment" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith("https://signed.test/proof", "_blank"));
    open.mockRestore();
  });

  it("tells the artist when no proof is available", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    h.getPayoutProofSignedUrl.mockResolvedValue(null);
    show({ payouts: [artistPayout({ status: "acknowledged", hasProofOfPayment: true })] });
    tab("Earnings");
    fireEvent.click(screen.getByRole("button", { name: "View proof of payment" }));
    expect(await screen.findByText(/No proof of payment has been uploaded/)).toBeTruthy();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

describe("StudioShell invitations", () => {
  it("shows an empty state", () => {
    show();
    tab("Invitations");
    expect(screen.getByText("No exhibition invitations yet.")).toBeTruthy();
  });

  it("badges the count of pending invitations on that tab only", () => {
    show({ exhibitionInvites: [invite(), invite({ id: "i2" }), invite({ id: "i3", status: "accepted" })] });
    expect(screen.queryByText(/awaiting response/)).toBeNull();
    tab("Invitations");
    expect(screen.getByText("2 awaiting response")).toBeTruthy();
  });

  it("accepting updates the invite optimistically and calls the server", async () => {
    show({ exhibitionInvites: [invite()] });
    tab("Invitations");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    await waitFor(() => expect(h.respondToExhibitionInvite).toHaveBeenCalledWith("i1", "accepted"));
  });

  it("declining marks the invite declined", async () => {
    show({ exhibitionInvites: [invite()] });
    tab("Invitations");
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.getByText("Declined")).toBeTruthy();
    await waitFor(() => expect(h.respondToExhibitionInvite).toHaveBeenCalledWith("i1", "declined"));
  });

  it("toasts when responding fails", async () => {
    h.respondToExhibitionInvite.mockRejectedValue(new Error("boom"));
    show({ exhibitionInvites: [invite()] });
    tab("Invitations");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByText(/Something went wrong responding/)).toBeTruthy();
  });
});

describe("StudioShell submissions list", () => {
  it("offers Edit on editable works and a lock on approved ones", () => {
    show({ works: [work(), work({ id: "w2", title: "Changes", status: "changes" }), work({ id: "w3", title: "Done", status: "approved", note: "Great" })] });
    tab("Submissions");
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
    expect(screen.getByText(/Locked/)).toBeTruthy();
    expect(screen.getByText(/Drop-off pass issued · WZ14/)).toBeTruthy();
  });

  it("opens the full-size image for works that have one", () => {
    show({ works: [work({ imageUrl: "https://cdn.test/a.jpg" })] });
    tab("Submissions");
    fireEvent.click(screen.getByRole("button", { name: "View Salt Pan full size" }));
    expect(document.querySelector('img[src="https://cdn.test/a.jpg"]')).not.toBeNull();
  });
});

describe("StudioShell open calls", () => {
  it("shows requirements and only offers submitting to accepting calls", () => {
    show({ openCalls: [openCall({ rules: "Max 3 works", mediumRequirements: "Oil" }), openCall({ id: "oc2", title: "Closed Show", accepting: false })] });
    tab("Open calls");
    expect(screen.getByText("Accepting")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
    expect(screen.getByText("Max 3 works")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Submit for this call" })).toHaveLength(1);
  });
});

describe("StudioShell profile", () => {
  it("masks the account number until revealed and keeps the email read-only", () => {
    show();
    tab("Profile");
    expect(screen.queryByDisplayValue("12345")).toBeNull();
    expect(screen.getByDisplayValue("•••••")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByDisplayValue("12345")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByDisplayValue("12345")).toBeNull();
    expect((screen.getByDisplayValue("ana@x.co") as HTMLInputElement).readOnly).toBe(true);
  });

  it("saves edits and confirms", async () => {
    show();
    tab("Profile");
    fireEvent.change(screen.getByDisplayValue("Ana"), { target: { value: "Anna" } });
    fireEvent.click(screen.getByRole("button", { name: "Update & save" }));
    await waitFor(() => expect(h.updateArtistProfile).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Anna", bankName: "FNB" })));
    expect(await screen.findByText("Profile saved.")).toBeTruthy();
  });

  it("shows the error message when saving fails", async () => {
    h.updateArtistProfile.mockRejectedValue(new Error("Invalid account number"));
    show();
    tab("Profile");
    fireEvent.click(screen.getByRole("button", { name: "Update & save" }));
    expect(await screen.findByText("Invalid account number")).toBeTruthy();
  });

  it("falls back to a generic message for non-Error failures", async () => {
    h.updateArtistProfile.mockRejectedValue("nope");
    show();
    tab("Profile");
    fireEvent.click(screen.getByRole("button", { name: "Update & save" }));
    expect(await screen.findByText("Couldn't save your profile.")).toBeTruthy();
  });
});

describe("StudioShell submit drawer", () => {
  const next = () => fireEvent.click(screen.getByRole("button", { name: "Continue →" }));
  const type = (label: RegExp | string, v: string) => fireEvent.change(typeof label === "string" ? screen.getByPlaceholderText(label) : screen.getByLabelText(label), { target: { value: v } });
  const picture = () => new File(["x"], "pic.PNG", { type: "image/png" });
  const addImage = (f: File = picture()) => fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [f] } });

  function openDrawer(props: Partial<Props> = {}) {
    show(props);
    tab("Submissions");
    fireEvent.click(screen.getByRole("button", { name: "Submit work" }));
  }
  function fillStep1(title = "New Work") {
    type("Work title", title);
    type("e.g. Oil on canvas", "Oil");
    type("2024", "2025");
    addImage();
  }
  function fillStep2() {
    type("e.g. 80", "80");
    type("e.g. 60", "60");
    type("e.g. 4", "4");
    type("e.g. R 18 000", "18000");
  }

  it("walks through three steps, gating each on its required fields", () => {
    openDrawer();
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy();
    const cont = () => screen.getByRole("button", { name: "Continue →" }) as HTMLButtonElement;
    expect(cont().disabled).toBe(true);
    fillStep1();
    expect(cont().disabled).toBe(false);
    next();
    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy();
    expect(cont().disabled).toBe(true);
    fillStep2();
    expect(cont().disabled).toBe(false);
    next();
    expect(screen.getByText(/Step 3 of 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy();
  });

  it("shows the sale price including the gallery's commission and the commission note", () => {
    openDrawer();
    fillStep1();
    next();
    fillStep2();
    expect(screen.getByText("Sale price to collectors").nextElementSibling!.textContent).toMatch(/25\s?200/);
    expect(screen.getByText("Gallery keeps 40%")).toBeTruthy();
  });

  it("rejects an image over 10 MB", () => {
    openDrawer();
    const big = picture();
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
    addImage(big);
    expect(screen.getByText("Image must be 10 MB or smaller.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue →" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("uploads the image then creates the submission, toasting and refreshing", async () => {
    openDrawer({ openCalls: [openCall()] });
    fillStep1();
    next();
    fillStep2();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(h.createSubmission).toHaveBeenCalled());
    const [path] = h.upload.mock.calls[0];
    expect(path).toMatch(/^u1\/[0-9a-f-]{36}\/\d+\.png$/);
    const fd = h.createSubmission.mock.calls[0][0] as FormData;
    expect(fd.get("title")).toBe("New Work");
    expect(fd.get("dim")).toBe("80 × 60 × 4 cm");
    expect(fd.get("exhibitionId")).toBe("oc1");
    expect(fd.get("imagePath")).toBe(path);
    expect(path).toContain(String(fd.get("id")));
    expect(await screen.findByText('"New Work" submitted for review.')).toBeTruthy();
    expect(h.refresh).toHaveBeenCalled();
    expect(screen.queryByText(/Step 3 of 3/)).toBeNull();
  });

  it("makes the artist acknowledge an exhibition's rules before submitting", async () => {
    openDrawer({ openCalls: [openCall({ rules: "Max 3 works" })] });
    fillStep1();
    next();
    fillStep2();
    next();
    const submit = screen.getByRole("button", { name: "Submit for review" }) as HTMLButtonElement;
    expect(screen.getByText(/Max 3 works/)).toBeTruthy();
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => expect(h.createSubmission).toHaveBeenCalled());
    expect((h.createSubmission.mock.calls[0][0] as FormData).get("rulesAck")).toBe("true");
  });

  it("toasts the error when the upload fails and creates nothing", async () => {
    h.upload.mockResolvedValue({ error: new Error("Bucket full") });
    openDrawer();
    fillStep1();
    next();
    fillStep2();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByText("Bucket full")).toBeTruthy();
    expect(h.createSubmission).not.toHaveBeenCalled();
  });

  it("refuses to upload when signed out", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });
    openDrawer();
    fillStep1();
    next();
    fillStep2();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByText("Not signed in.")).toBeTruthy();
  });

  it("falls back to a generic message when the action fails without one", async () => {
    h.createSubmission.mockRejectedValue("x");
    openDrawer();
    fillStep1();
    next();
    fillStep2();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByText("Something went wrong submitting your work.")).toBeTruthy();
  });

  it("closes from × without submitting", () => {
    openDrawer();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(screen.queryByText(/Step 1 of 3/)).toBeNull();
  });

  it("edits an existing submission, prefilled, without needing a new image", async () => {
    show({ works: [work({ imageUrl: "https://cdn.test/a.jpg" })] });
    tab("Submissions");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit submission")).toBeTruthy();
    expect((screen.getByPlaceholderText("Work title") as HTMLInputElement).value).toBe("Salt Pan");
    expect(screen.queryByText("Submitting for")).toBeNull();
    next();
    expect((screen.getByPlaceholderText("e.g. 80") as HTMLInputElement).value).toBe("90");
    expect((screen.getByPlaceholderText("e.g. 60") as HTMLInputElement).value).toBe("120");
    expect((screen.getByPlaceholderText("e.g. 4") as HTMLInputElement).value).toBe("4");
    next();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(h.updateSubmission).toHaveBeenCalledWith("w1", expect.any(FormData)));
    expect(h.upload).not.toHaveBeenCalled();
    expect(await screen.findByText('"Salt Pan II" updated.')).toBeTruthy();
    expect(h.refresh).toHaveBeenCalled();
    expect(screen.getByText("Salt Pan II")).toBeTruthy();
  });

  it("opens from an open call card", () => {
    show({ openCalls: [openCall()] });
    tab("Open calls");
    fireEvent.click(screen.getByRole("button", { name: "Submit for this call" }));
    expect(screen.getByText("Submit work", { selector: "div" })).toBeTruthy();
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("oc1");
  });
});

describe("StudioShell toast", () => {
  it("disappears after a few seconds", () => {
    vi.useFakeTimers();
    try {
      show({ works: [declined()] });
      fireEvent.click(screen.getByRole("button", { name: "Read the full message →" }));
      fireEvent.click(screen.getByRole("button", { name: /I understand/ }));
      expect(screen.getByText("Decision acknowledged.")).toBeTruthy();
      act(() => { vi.advanceTimersByTime(3100); });
      expect(screen.queryByText("Decision acknowledged.")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
