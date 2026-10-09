import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  revalidatePath: vi.fn(),
  headerValues: {} as Record<string, string>,
  gallery: {
    id: "gal-1",
    name: "Woza Art",
    commission_rate: 0.4,
    theme_colors: { accent: "#B5623C" },
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({}),
  headers: async () => ({ get: (k: string) => h.headerValues[k] ?? null }),
}));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));
vi.mock("@/lib/supabase/gallery", () => ({ getCurrentGallery: async () => h.gallery }));
vi.mock("@/lib/supabase/queries", () => ({ getPayoutProofUrl: vi.fn(async () => "https://signed.test/proof") }));

import * as actions from "./actions";

const dbError = { message: "boom", code: "XX000" };

beforeEach(() => {
  h.fake = createFakeSupabase();
  h.revalidatePath.mockClear();
  h.headerValues = {};
  delete process.env.NEXT_PUBLIC_APP_URL;
});

function signIn(role?: string, id = "user-1") {
  h.fake.state.user = { id, user_metadata: { role, full_name: "Gail Gallerist" } };
}

describe("simple mutations", () => {
  it("decideSubmission updates status and note, clears ack only when declined", async () => {
    await actions.decideSubmission("s1", "declined", "too large");
    expect(h.fake.last("submissions", "update")).toMatchObject({
      payload: { status: "declined", note: "too large", ack: false },
      filters: [["id", "s1"]],
    });
    await actions.decideSubmission("s1", "approved", "");
    expect(h.fake.last("submissions", "update")?.payload).toMatchObject({ ack: null });
    expect(h.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("throws the database error and does not revalidate", async () => {
    h.fake.on("submissions", "update", { error: dbError });
    await expect(actions.decideSubmission("s1", "approved", "")).rejects.toBe(dbError);
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it("archive / unarchive set exhibition status", async () => {
    await actions.archiveExhibition("e1");
    expect(h.fake.last("exhibitions", "update")?.payload).toEqual({ status: "archived" });
    await actions.unarchiveExhibition("e1");
    expect(h.fake.last("exhibitions", "update")?.payload).toEqual({ status: "planning" });
    await actions.unarchiveExhibition("e1", "closed");
    expect(h.fake.last("exhibitions", "update")?.payload).toEqual({ status: "closed" });
  });

  it("calls the artist-facing RPCs and revalidates /studio", async () => {
    await actions.ackDeclinedSubmission("s1");
    await actions.acknowledgePayout("p1");
    await actions.queryPayout("p2");
    expect(h.fake.rpcCalls).toEqual([
      { fn: "submissions_update_artist_ack", args: { p_submission_id: "s1" } },
      { fn: "acknowledge_payout", args: { p_payout_id: "p1" } },
      { fn: "query_payout", args: { p_payout_id: "p2" } },
    ]);
    expect(h.revalidatePath).toHaveBeenCalledTimes(3);
    expect(h.revalidatePath).toHaveBeenCalledWith("/studio");
  });

  it("revokes and responds to exhibition invites", async () => {
    signIn();
    await actions.revokeExhibitionInvite("i1");
    expect(h.fake.last("exhibition_invites", "update")?.payload).toEqual({ status: "revoked" });
    await actions.respondToExhibitionInvite("i1", "accepted");
    expect(h.fake.last("exhibition_invites", "update")?.payload).toMatchObject({
      status: "accepted",
      artist_id: "user-1",
    });
  });

  it("respondToExhibitionInvite requires a signed-in user", async () => {
    await expect(actions.respondToExhibitionInvite("i1", "declined")).rejects.toThrow("Not signed in.");
  });
});

describe("createSubmission", () => {
  const form = (fields: Record<string, string | File>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  };

  it("requires a signed-in user", async () => {
    await expect(actions.createSubmission(form({}))).rejects.toThrow("Not signed in.");
  });

  it("applies defaults and normalises price", async () => {
    signIn("artist");
    const res = await actions.createSubmission(form({ price: "R 12,500.50", rulesAck: "true" }));
    expect(res.title).toBe("Untitled");
    expect(h.fake.last("submissions", "insert")?.payload).toMatchObject({
      id: res.id,
      gallery_id: "gal-1",
      artist_id: "user-1",
      title: "Untitled",
      price: 12500.5,
      year: new Date().getFullYear(),
      exhibition_id: null,
      image_url: null,
      rules_ack: true,
    });
    expect(h.revalidatePath).toHaveBeenCalledWith("/studio");
  });

  it("treats a missing or non-numeric price as null and rulesAck as false", async () => {
    signIn("artist");
    await actions.createSubmission(form({ price: "ask", rulesAck: "no" }));
    expect(h.fake.last("submissions", "insert")?.payload).toMatchObject({ price: null, rules_ack: false });
  });

  it("uploads the image under the user/submission path and stores its public URL", async () => {
    signIn("artist");
    const image = new File(["x"], "piece.PNG", { type: "image/png" });
    const res = await actions.createSubmission(form({ title: "Dusk", image }));
    expect(h.fake.uploads).toHaveLength(1);
    expect(h.fake.uploads[0].path).toBe(`user-1/${res.id}/original.PNG`);
    expect(h.fake.last("submissions", "insert")?.payload).toMatchObject({
      image_url: `https://cdn.test/submission-images/user-1/${res.id}/original.PNG`,
    });
  });

  it("still inserts the submission when the upload fails", async () => {
    signIn("artist");
    h.fake.state.uploadError = { message: "nope" };
    await actions.createSubmission(form({ image: new File(["x"], "a.jpg", { type: "image/jpeg" }) }));
    expect(h.fake.last("submissions", "insert")?.payload).toMatchObject({ image_url: null });
  });

  it("skips upload for an empty file", async () => {
    signIn("artist");
    await actions.createSubmission(form({ image: new File([], "empty.jpg") }));
    expect(h.fake.uploads).toHaveLength(0);
  });
});

describe("contacts and invites", () => {
  const input = { name: "Ann", email: "ann@x.com", role: "Artist" as const, focus: "", sendInvite: true };

  it("createContact requires sign-in", async () => {
    await expect(actions.createContact(input)).rejects.toThrow("Not signed in.");
  });

  it("inserts the contact with null focus when blank", async () => {
    signIn("gallery");
    h.fake.on("contacts", "insert", { data: { id: "c1" } });
    const res = await actions.createContact({ ...input, sendInvite: false });
    expect(res).toEqual({ id: "c1", inviteError: undefined });
    expect(h.fake.last("contacts", "insert")?.payload).toMatchObject({
      gallery_id: "gal-1",
      email: "ann@x.com",
      focus: null,
    });
    expect(h.fake.invocations).toHaveLength(0);
  });

  it("invites an Artist contact and passes gallery details to the edge function", async () => {
    signIn("gallery");
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    h.fake.on("contacts", "insert", { data: { id: "c1" } });
    await actions.createContact(input);
    expect(h.fake.invocations).toEqual([
      {
        fn: "send-artist-invite",
        body: {
          galleryId: "gal-1",
          galleryName: "Woza Art",
          accentColor: "#B5623C",
          appUrl: "https://app.test",
          inviterName: "Gail Gallerist",
          artistEmail: "ann@x.com",
          artistName: "Ann",
        },
      },
    ]);
  });

  it("does not invite Collectors", async () => {
    signIn("gallery");
    h.fake.on("contacts", "insert", { data: { id: "c1" } });
    await actions.createContact({ ...input, role: "Collector" });
    expect(h.fake.invocations).toHaveLength(0);
  });

  it("returns the invite failure instead of throwing, keeping the contact", async () => {
    signIn("gallery");
    h.fake.on("contacts", "insert", { data: { id: "c1" } });
    h.fake.state.invokeResult = { data: { error: "already invited" }, error: null };
    const res = await actions.createContact(input);
    expect(res).toEqual({ id: "c1", inviteError: "already invited" });
  });

  it("derives the app URL from the host header when no env var is set", async () => {
    signIn("gallery");
    h.headerValues.host = "localhost:3000";
    await actions.inviteArtist("a@x.com", "A");
    expect((h.fake.invocations[0].body as { appUrl: string }).appUrl).toBe("http://localhost:3000");
    h.headerValues.host = "gallery.example.com";
    await actions.inviteArtist("a@x.com", "A");
    expect((h.fake.invocations[1].body as { appUrl: string }).appUrl).toBe("https://gallery.example.com");
  });

  it("inviteArtist surfaces edge-function errors", async () => {
    signIn("gallery");
    h.fake.state.invokeResult = { data: null, error: { message: "fn failed" } };
    await expect(actions.inviteArtist("a@x.com", "A")).rejects.toThrow("fn failed");
  });

  it("inviteArtist prefers the JSON error body from the function response", async () => {
    signIn("gallery");
    h.fake.state.invokeResult = {
      data: null,
      error: { message: "generic", context: { json: async () => ({ error: "specific reason" }) } },
    };
    await expect(actions.inviteArtist("a@x.com", "A")).rejects.toThrow("specific reason");
  });
});

describe("exhibitions", () => {
  const base = {
    title: "Spring", type: "group" as const, blurb: "", theme: "", mediumRequirements: "",
    sizeRequirements: "", rules: "", slots: 10, submissionDeadline: null, openingDate: null,
    closingDate: null, deliveryDate: null,
  };

  it("createExhibition is restricted to gallery users", async () => {
    signIn("artist");
    await expect(actions.createExhibition(base)).rejects.toThrow("Not signed in.");
    expect(h.fake.last("exhibitions")).toBeUndefined();
  });

  it("createExhibition maps fields to columns and nulls blank text", async () => {
    signIn("gallery");
    h.fake.on("exhibitions", "insert", { data: { id: "e1" } });
    expect(await actions.createExhibition(base)).toEqual({ id: "e1" });
    expect(h.fake.last("exhibitions", "insert")?.payload).toMatchObject({
      gallery_id: "gal-1",
      status: "planning",
      title: "Spring",
      blurb: null,
      medium_requirements: null,
      slots: 10,
      submission_deadline: null,
    });
  });

  it("updateExhibition only sends the fields provided", async () => {
    await actions.updateExhibition("e1", { title: "New", slots: 3 });
    expect(h.fake.last("exhibitions", "update")?.payload).toEqual({ title: "New", slots: 3 });
  });

  it("deleteExhibition refuses when submissions exist", async () => {
    h.fake.on("submissions", "select", { count: 2 });
    await expect(actions.deleteExhibition("e1")).rejects.toThrow(/archive it instead/);
    expect(h.fake.last("exhibitions", "delete")).toBeUndefined();
  });

  it("deleteExhibition deletes when there are none", async () => {
    h.fake.on("submissions", "select", { count: 0 });
    await actions.deleteExhibition("e1");
    expect(h.fake.last("exhibitions", "delete")?.filters).toEqual([["id", "e1"]]);
  });

  it("inviteArtistToExhibition looks up the title and sends the invite", async () => {
    signIn("gallery");
    h.fake.on("exhibitions", "select", { data: { title: "Spring" } });
    await actions.inviteArtistToExhibition("e1", { email: "a@x.com", existingArtistId: "art-9" }, "hi");
    expect(h.fake.invocations[0]).toMatchObject({
      fn: "send-exhibition-invite",
      body: { exhibitionId: "e1", exhibitionTitle: "Spring", existingArtistId: "art-9", message: "hi" },
    });
  });
});

describe("catalogue", () => {
  it("stores the commission as a fraction and passes null through", async () => {
    await actions.updateCatalogueWork("w1", { commissionRatePct: 35 });
    expect(h.fake.last("catalogue_works", "update")?.payload).toEqual({ commission_rate: 0.35 });
    await actions.updateCatalogueWork("w1", { commissionRatePct: null });
    expect(h.fake.last("catalogue_works", "update")?.payload).toEqual({ commission_rate: null });
  });

  it("createCatalogueWork inserts under the current gallery", async () => {
    h.fake.on("catalogue_works", "insert", { data: { id: "w1" } });
    const res = await actions.createCatalogueWork({
      artistId: "a1", title: "Piece", price: 1000, agreedPrice: 900, commissionRatePct: 40,
      status: "available", consignedDate: "2026-01-01",
    });
    expect(res).toEqual({ id: "w1" });
    expect(h.fake.last("catalogue_works", "insert")?.payload).toMatchObject({
      gallery_id: "gal-1", artist_id: "a1", commission_rate: 0.4, consigned_at: "2026-01-01",
    });
  });

  describe("acceptSubmissionIntoCatalogue", () => {
    const approved = { title: "Piece", price: 500, artist_id: "a1", status: "approved" };

    it("rejects submissions that are not approved", async () => {
      h.fake.on("submissions", "select", { data: { ...approved, status: "pending" } });
      await expect(actions.acceptSubmissionIntoCatalogue("s1")).rejects.toThrow(/Only approved/);
      expect(h.fake.last("catalogue_works")).toBeUndefined();
    });

    it("copies submission details and the gallery's default commission", async () => {
      h.fake.on("submissions", "select", { data: approved });
      h.fake.on("catalogue_works", "insert", { data: { id: "w1" } });
      expect(await actions.acceptSubmissionIntoCatalogue("s1")).toEqual({ id: "w1" });
      expect(h.fake.last("catalogue_works", "insert")?.payload).toMatchObject({
        submission_id: "s1", artist_id: "a1", price: 500, agreed_price: 500,
        commission_rate: 0.4, status: "available",
        consigned_at: new Date().toISOString().slice(0, 10),
      });
    });

    it("maps a unique-violation to a friendly message", async () => {
      h.fake.on("submissions", "select", { data: approved });
      h.fake.on("catalogue_works", "insert", { error: { code: "23505", message: "dup" } });
      await expect(actions.acceptSubmissionIntoCatalogue("s1")).rejects.toThrow("already in the catalogue");
    });

    it("rethrows other insert errors untouched", async () => {
      h.fake.on("submissions", "select", { data: approved });
      h.fake.on("catalogue_works", "insert", { error: dbError });
      await expect(actions.acceptSubmissionIntoCatalogue("s1")).rejects.toBe(dbError);
    });
  });
});

describe("recordSale", () => {
  const sale = {
    catalogueWorkId: "w1", salePriceCents: 100000, discountCents: 5000, commissionRatePct: 40,
    buyerName: "Bo", buyerEmail: null, buyerPhone: null, soldDate: "2026-02-01",
    buyerPaidDate: null, payoutDueDate: null,
  };

  it("converts commission to a fraction and omits null optionals", async () => {
    h.fake.onRpc("record_sale", { data: "sale-1" });
    await actions.recordSale(sale);
    expect(h.fake.rpcCalls[0]).toEqual({
      fn: "record_sale",
      args: {
        p_catalogue_work_id: "w1", p_sale_price_cents: 100000, p_discount_cents: 5000,
        p_commission_rate: 0.4, p_buyer_name: "Bo", p_buyer_email: undefined,
        p_buyer_phone: undefined, p_sold_at: "2026-02-01", p_buyer_paid_at: undefined,
        p_payout_due_at: undefined,
      },
    });
  });

  it("sends the sale notice after the sale is recorded", async () => {
    h.fake.onRpc("record_sale", { data: "sale-1" });
    const res = await actions.recordSale(sale);
    expect(res).toEqual({ id: "sale-1", noticeError: undefined });
    expect(h.fake.invocations[0]).toMatchObject({ fn: "send-sale-notice", body: { saleId: "sale-1" } });
  });

  it("does not fail the sale when the notice fails", async () => {
    h.fake.onRpc("record_sale", { data: "sale-1" });
    h.fake.state.invokeResult = { data: null, error: { message: "smtp down" } };
    const res = await actions.recordSale(sale);
    expect(res).toEqual({ id: "sale-1", noticeError: "smtp down" });
    expect(h.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("throws and sends no notice when the RPC fails", async () => {
    h.fake.onRpc("record_sale", { error: dbError });
    await expect(actions.recordSale(sale)).rejects.toBe(dbError);
    expect(h.fake.invocations).toHaveLength(0);
  });
});

describe("markPayoutPaid", () => {
  const base = { payoutId: "p1", paidDate: "2026-03-01", paymentReference: "REF1", proofOfPayment: null };

  it("calls the RPC without proof and notifies", async () => {
    const res = await actions.markPayoutPaid(base);
    expect(h.fake.uploads).toHaveLength(0);
    expect(h.fake.rpcCalls[0]).toEqual({
      fn: "mark_payout_paid",
      args: { p_payout_id: "p1", p_paid_at: "2026-03-01", p_payment_reference: "REF1", p_proof_of_payment_path: undefined },
    });
    expect(h.fake.invocations[0]).toMatchObject({ fn: "send-payout-notice", body: { payoutId: "p1" } });
    expect(res).toEqual({ noticeError: undefined });
  });

  it("uploads proof under gallery/payout and passes the path to the RPC", async () => {
    const proof = new File(["pdf"], "proof.pdf", { type: "application/pdf" });
    await actions.markPayoutPaid({ ...base, proofOfPayment: proof });
    expect(h.fake.uploads[0]).toMatchObject({ bucket: "payout-proofs", path: "gal-1/p1/proof.pdf" });
    expect((h.fake.rpcCalls[0].args as { p_proof_of_payment_path: string }).p_proof_of_payment_path).toBe(
      "gal-1/p1/proof.pdf",
    );
  });

  it("aborts before marking paid when the proof upload fails", async () => {
    h.fake.state.uploadError = new Error("storage down");
    const proof = new File(["pdf"], "proof.pdf");
    await expect(actions.markPayoutPaid({ ...base, proofOfPayment: proof })).rejects.toThrow("storage down");
    expect(h.fake.rpcCalls).toHaveLength(0);
  });

  it("getPayoutProofSignedUrl delegates to the query helper", async () => {
    expect(await actions.getPayoutProofSignedUrl("p1")).toBe("https://signed.test/proof");
  });
});

describe("updateArtistProfile", () => {
  const input = {
    firstName: " Ann ", lastName: " Lee ", phone: " ", bankName: " FNB ",
    accountNumber: "123", branchCode: "", accountType: "cheque",
  };

  it("requires sign-in", async () => {
    await expect(actions.updateArtistProfile(input)).rejects.toThrow("Not signed in.");
  });

  it("requires a name", async () => {
    signIn("artist");
    await expect(actions.updateArtistProfile({ ...input, firstName: " ", lastName: "" })).rejects.toThrow(
      "Name is required.",
    );
    expect(h.fake.last("artist_profiles")).toBeUndefined();
  });

  it("trims the name, nulls blanks, and upserts bank details by user id", async () => {
    signIn("artist");
    await actions.updateArtistProfile(input);
    expect(h.fake.last("artist_profiles", "update")).toMatchObject({
      payload: { full_name: "Ann Lee", phone: null },
      filters: [["id", "user-1"]],
    });
    expect(h.fake.last("artist_bank_details", "upsert")?.payload).toEqual({
      id: "user-1",
      bank_name: "FNB",
      bank_account_number: "123",
      branch_code: null,
      account_type: "cheque",
    });
  });

  it("does not touch bank details if the profile update fails", async () => {
    signIn("artist");
    h.fake.on("artist_profiles", "update", { error: dbError });
    await expect(actions.updateArtistProfile(input)).rejects.toBe(dbError);
    expect(h.fake.last("artist_bank_details")).toBeUndefined();
  });
});
