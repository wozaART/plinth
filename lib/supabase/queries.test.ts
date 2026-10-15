import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";
import { formatCurrency } from "@/lib/currency";
import { shortDate } from "@/lib/utils";
import * as q from "./queries";
import type { Database } from "./database.types";

let fake: FakeSupabase;
let db: SupabaseClient<Database>;

beforeEach(() => {
  fake = createFakeSupabase();
  db = fake.client as unknown as SupabaseClient<Database>;
});

const dbError = { message: "boom", code: "XX000" };
const ZAR = "ZAR";
const filter = (query: { filters: [string, unknown][] } | undefined, col: string) =>
  query?.filters.find(([c]) => c === col)?.[1];

// Every list query should surface database errors rather than swallow them.
describe("error propagation", () => {
  const cases: [string, string, () => Promise<unknown>][] = [
    ["consignment_terms_responses", "getConsignmentTermsResponses", () => q.getConsignmentTermsResponses(db)],
    ["submissions", "getSubmissions", () => q.getSubmissions(db, "g1", ZAR)],
    ["exhibition_invites", "getExhibitionInvitesForGallery", () => q.getExhibitionInvitesForGallery(db, "g1")],
    ["exhibition_invites", "getExhibitionInvitesForArtist", () => q.getExhibitionInvitesForArtist(db, "a1", "a@x.co")],
    ["catalogue_works", "getCatalogue", () => q.getCatalogue(db, "g1", ZAR)],
    ["sales", "getSales", () => q.getSales(db, "g1", ZAR)],
    ["payouts", "getPayouts", () => q.getPayouts(db, "g1", ZAR)],
    ["submissions", "getGalleryArtists", () => q.getGalleryArtists(db, "g1")],
    ["frame_jobs", "getFrameJobs", () => q.getFrameJobs(db, "g1")],
    ["contacts", "getContacts", () => q.getContacts(db, "g1")],
    ["audit_log", "getAuditLog", () => q.getAuditLog(db, "g1")],
    ["submissions", "getArtistWorks", () => q.getArtistWorks(db, "a1", "g1")],
    ["catalogue_works", "getArtistCatalogue", () => q.getArtistCatalogue(db, "a1", "g1", ZAR)],
    ["artist_sales", "getArtistSales", () => q.getArtistSales(db, "a1", "g1", ZAR)],
    ["payouts", "getArtistPayouts", () => q.getArtistPayouts(db, "a1", "g1", ZAR)],
    ["exhibitions", "getOpenCalls", () => q.getOpenCalls(db, "g1", "Woza")],
    ["messages", "getMessages", () => q.getMessages(db, "a1", "g1", "Woza")],
  ];

  it.each(cases)("%s: %s throws the database error", async (table, _name, run) => {
    fake.on(table, "select", { data: null, error: dbError });
    await expect(run()).rejects.toBe(dbError);
  });

  it.each(cases)("%s: %s returns [] when there are no rows", async (table, _name, run) => {
    fake.on(table, "select", { data: null, error: null });
    await expect(run()).resolves.toEqual([]);
  });
});

describe("getConsignmentTermsResponses", () => {
  it("maps rows, defaults null answers and sorts followups oldest first", async () => {
    fake.on("consignment_terms_responses", "select", {
      data: [
        {
          id: "r1",
          created_at: "2026-01-01T00:00:00Z",
          gallery_name: "Gallery A",
          contact_name: "Pat",
          contact_role: null,
          contact_email: "pat@a.co",
          status: "submitted",
          answers: { commission_percent: "40" },
          consignment_terms_followups: [
            { id: "f2", message: "later", created_at: "2026-02-02T00:00:00Z" },
            { id: "f1", message: "earlier", created_at: "2026-02-01T00:00:00Z" },
          ],
        },
        {
          id: "r2",
          created_at: "2026-01-02T00:00:00Z",
          gallery_name: "Gallery B",
          contact_name: "Sam",
          contact_role: "Owner",
          contact_email: null,
          status: "new",
          answers: null,
          consignment_terms_followups: null,
        },
      ],
      error: null,
    });
    const [a, b] = await q.getConsignmentTermsResponses(db);
    expect(a).toMatchObject({ id: "r1", galleryName: "Gallery A", contactRole: null, answers: { commission_percent: "40" } });
    expect(a.followups.map((f) => f.id)).toEqual(["f1", "f2"]);
    expect(b).toMatchObject({ answers: {}, followups: [], contactEmail: null });
    expect(fake.last("consignment_terms_responses")?.orderBy[0]).toEqual(["created_at", { ascending: false }]);
  });
});

describe("getSubmissions", () => {
  it("scopes to the gallery and maps display fields", async () => {
    fake.on("submissions", "select", {
      data: [
        {
          id: "s1",
          title: "Sunrise",
          artist_profiles: { full_name: "Ana" },
          exhibitions: { title: "Spring" },
          year: 2024,
          medium: "Oil",
          dim: "10x10",
          price: "1500",
          created_at: "2020-01-01T00:00:00Z",
          status: "pending",
          note: null,
          ack: true,
          rules_ack: true,
          statement: "hi",
          image_url: "https://img/1.jpg",
        },
        {
          id: "s2",
          title: "Bare",
          artist_profiles: null,
          exhibitions: null,
          year: null,
          medium: null,
          dim: null,
          price: null,
          created_at: "2020-01-01T00:00:00Z",
          status: "declined",
          note: "no",
          ack: null,
          rules_ack: null,
          statement: null,
          image_url: null,
        },
      ],
      error: null,
    });
    const [full, bare] = await q.getSubmissions(db, "g1", ZAR);
    expect(filter(fake.last("submissions"), "gallery_id")).toBe("g1");
    expect(filter(fake.last("submissions"), "archived_at is")).toBeNull();
    expect(full).toMatchObject({
      artist: "Ana",
      forEx: "Spring",
      year: 2024,
      price: formatCurrency(1500, ZAR),
      ack: true,
      imageUrl: "https://img/1.jpg",
    });
    expect(bare).toMatchObject({
      artist: "Unknown artist",
      forEx: "Open submissions",
      year: 0,
      medium: "",
      dim: "",
      price: formatCurrency(0, ZAR),
      statement: "",
      ack: undefined,
      rulesAck: undefined,
      imageUrl: undefined,
    });
  });
});

describe("getExhibitionsWithCounts", () => {
  const base = {
    type: "open_call",
    status: "open",
    blurb: null,
    theme: null,
    medium_requirements: null,
    size_requirements: null,
    rules: null,
    slots: 10,
    submission_deadline: null,
    opening_date: null,
    closing_date: null,
    delivery_date: null,
    created_at: "2026-01-01T00:00:00Z",
  };

  it("joins counts, defaults missing counts to zero and builds date labels", async () => {
    fake.on("exhibitions", "select", {
      data: [
        { ...base, id: "e1", title: "Both", opening_date: "2026-03-01", closing_date: "2026-04-01" },
        { ...base, id: "e2", title: "Open only", opening_date: "2026-03-01" },
        { ...base, id: "e3", title: "Close only", closing_date: "2026-04-01" },
        { ...base, id: "e4", title: "Deadline", submission_deadline: "2026-02-01" },
        { ...base, id: "e5", title: "None" },
      ],
      error: null,
    });
    fake.on("exhibition_counts", "select", { data: [{ exhibition_id: "e1", filled: 3, applicants: 7 }], error: null });
    const list = await q.getExhibitionsWithCounts(db, "g1");
    expect(list.map((e) => e.dates)).toEqual([
      `${shortDate("2026-03-01")} – ${shortDate("2026-04-01")}`,
      `Opens ${shortDate("2026-03-01")}`,
      `Closes ${shortDate("2026-04-01")}`,
      `Submissions close ${shortDate("2026-02-01")}`,
      "Dates to be confirmed",
    ]);
    expect(list[0]).toMatchObject({ filled: 3, applicants: 7, blurb: "", slots: 10 });
    expect(list[1]).toMatchObject({ filled: 0, applicants: 0 });
  });

  it("excludes archived exhibitions unless asked", async () => {
    await q.getExhibitionsWithCounts(db, "g1");
    expect(filter(fake.last("exhibitions"), "status!=")).toBe("archived");
    await q.getExhibitionsWithCounts(db, "g1", true);
    expect(filter(fake.last("exhibitions"), "status!=")).toBeUndefined();
  });

  it("throws if either query fails", async () => {
    fake.on("exhibitions", "select", { data: null, error: dbError });
    await expect(q.getExhibitionsWithCounts(db, "g1")).rejects.toBe(dbError);
    fake.on("exhibitions", "select", { data: [], error: null });
    fake.on("exhibition_counts", "select", { data: null, error: dbError });
    await expect(q.getExhibitionsWithCounts(db, "g1")).rejects.toBe(dbError);
  });
});

describe("exhibition invites", () => {
  const row = {
    id: "i1",
    exhibition_id: "e1",
    exhibitions: null,
    artist_id: null,
    email: "a@x.co",
    full_name: null,
    message: null,
    status: "pending",
    created_at: "c",
    expires_at: "e",
    responded_at: null,
  };

  it("maps nulls to empty strings for the gallery view", async () => {
    fake.on("exhibition_invites", "select", { data: [row], error: null });
    const [inv] = await q.getExhibitionInvitesForGallery(db, "g1");
    expect(inv).toMatchObject({ exhibitionTitle: "", fullName: "", message: "", artistId: null, respondedAt: null });
    expect(filter(fake.last("exhibition_invites"), "gallery_id")).toBe("g1");
  });

  it("matches the artist by id or email for the studio view", async () => {
    fake.on("exhibition_invites", "select", { data: [{ ...row, exhibitions: { title: "Spring" } }], error: null });
    const [inv] = await q.getExhibitionInvitesForArtist(db, "a1", "a@x.co");
    expect(inv.exhibitionTitle).toBe("Spring");
    expect(filter(fake.last("exhibition_invites"), "or")).toBe("artist_id.eq.a1,email.ilike.a@x.co");
  });
});

describe("catalogue", () => {
  const work = {
    id: "w1",
    title: "Piece",
    artist_id: "a1",
    artist_profiles: { full_name: "Ana" },
    price: 2000,
    agreed_price: 1800,
    commission_rate: 0.4,
    status: "available",
    consigned_at: "2026-03-01",
    submission_id: "s1",
  };

  it("maps prices, commission percentage and dates", async () => {
    fake.on("catalogue_works", "select", { data: [work], error: null });
    const [w] = await q.getCatalogue(db, "g1", ZAR);
    expect(w).toMatchObject({
      artist: "Ana",
      price: formatCurrency(2000, ZAR),
      priceRaw: 2000,
      agreedPrice: formatCurrency(1800, ZAR),
      commissionRatePct: 40,
      consignedDate: shortDate("2026-03-01"),
    });
  });

  it("uses placeholders for missing values", async () => {
    fake.on("catalogue_works", "select", {
      data: [{ ...work, artist_profiles: null, price: null, agreed_price: null, commission_rate: null, consigned_at: null }],
      error: null,
    });
    const [w] = await q.getCatalogue(db, "g1", ZAR);
    expect(w).toMatchObject({
      artist: "Unknown artist",
      price: "—",
      agreedPrice: "—",
      commissionRatePct: null,
      consignedDate: "—",
    });
  });

  it("rounds fractional commission rates", async () => {
    fake.on("catalogue_works", "select", { data: [{ ...work, commission_rate: 0.333 }], error: null });
    expect((await q.getCatalogue(db, "g1", ZAR))[0].commissionRatePct).toBe(33);
  });

  it("artist catalogue is scoped to both artist and gallery", async () => {
    await q.getArtistCatalogue(db, "a1", "g1", ZAR);
    const query = fake.last("catalogue_works");
    expect(filter(query, "artist_id")).toBe("a1");
    expect(filter(query, "gallery_id")).toBe("g1");
  });
});

describe("getSales", () => {
  const sale = {
    id: "sale1",
    catalogue_work_id: "w1",
    artist_id: "a1",
    artist_profiles: { full_name: "Ana" },
    catalogue_works: { title: "Piece" },
    sale_price_cents: 150000,
    discount_cents: 5000,
    commission_rate: 0.4,
    commission_amount_cents: 60000,
    artist_amount_cents: 90000,
    buyer_name: "Bo",
    buyer_email: "bo@x.co",
    buyer_phone: "082",
    sold_at: "2026-03-01T10:00:00Z",
    buyer_paid_at: "2026-03-02T10:00:00Z",
    payout_due_at: "2026-04-01T10:00:00Z",
  };

  it("converts cents to formatted amounts and keeps buyer details for the gallery", async () => {
    fake.on("sales", "select", { data: [sale], error: null });
    const [s] = await q.getSales(db, "g1", ZAR);
    expect(s).toMatchObject({
      salePrice: formatCurrency(1500, ZAR),
      salePriceCents: 150000,
      discountCents: 5000,
      commissionRatePct: 40,
      commissionAmount: formatCurrency(600, ZAR),
      artistAmount: formatCurrency(900, ZAR),
      buyerName: "Bo",
      buyerEmail: "bo@x.co",
      soldDate: shortDate(sale.sold_at),
      buyerPaidDate: shortDate(sale.buyer_paid_at),
      payoutDueDate: shortDate(sale.payout_due_at),
    });
    expect(filter(fake.last("sales"), "gallery_id")).toBe("g1");
  });

  it("handles unpaid sales and missing joins", async () => {
    fake.on("sales", "select", {
      data: [{ ...sale, artist_profiles: null, catalogue_works: null, buyer_paid_at: null, payout_due_at: null }],
      error: null,
    });
    const [s] = await q.getSales(db, "g1", ZAR);
    expect(s).toMatchObject({
      artist: "Unknown artist",
      workTitle: "Untitled work",
      buyerPaidDate: "—",
      payoutDueDate: "—",
      buyerPaidDateRaw: null,
    });
  });
});

describe("payouts", () => {
  const payout = {
    id: "p1",
    sale_id: "sale1",
    artist_id: "a1",
    artist_profiles: { full_name: "Ana" },
    sales: { payout_due_at: "2026-04-01T10:00:00Z", catalogue_works: { title: "Piece" } },
    amount_cents: 90000,
    status: "paid",
    paid_at: "2026-04-02T10:00:00Z",
    payment_reference: "REF1",
    proof_of_payment_path: "a/b.pdf",
    acknowledged_at: "2026-04-03T10:00:00Z",
  };

  it("gallery view maps amounts, dates and proof flag", async () => {
    fake.on("payouts", "select", { data: [payout], error: null });
    const [p] = await q.getPayouts(db, "g1", ZAR);
    expect(p).toMatchObject({
      artist: "Ana",
      workTitle: "Piece",
      amount: formatCurrency(900, ZAR),
      amountCents: 90000,
      dueDate: shortDate("2026-04-01T10:00:00Z"),
      paidDate: shortDate("2026-04-02T10:00:00Z"),
      hasProofOfPayment: true,
      acknowledgedDate: shortDate("2026-04-03T10:00:00Z"),
    });
  });

  it("gallery view handles pending payouts with no sale join", async () => {
    fake.on("payouts", "select", {
      data: [{ ...payout, status: "pending", sales: null, artist_profiles: null, paid_at: null, proof_of_payment_path: null, acknowledged_at: null }],
      error: null,
    });
    const [p] = await q.getPayouts(db, "g1", ZAR);
    expect(p).toMatchObject({
      artist: "Unknown artist",
      workTitle: "Untitled work",
      dueDate: "—",
      dueDateRaw: null,
      paidDate: "—",
      hasProofOfPayment: false,
      acknowledgedDate: "—",
    });
  });

  it("artist view is scoped to the artist and omits other artists' fields", async () => {
    const { sales, ...rest } = payout;
    fake.on("payouts", "select", { data: [{ ...rest, artist_sales: sales }], error: null });
    const [p] = await q.getArtistPayouts(db, "a1", "g1", ZAR);
    const query = fake.last("payouts");
    expect(filter(query, "artist_id")).toBe("a1");
    expect(filter(query, "gallery_id")).toBe("g1");
    expect(p).toMatchObject({ amount: formatCurrency(900, ZAR), paymentReference: "REF1", hasProofOfPayment: true });
    expect(p).not.toHaveProperty("artist");
    expect(p).not.toHaveProperty("artistId");
    expect(p).toMatchObject({ workTitle: "Piece", dueDate: shortDate("2026-04-01T10:00:00Z") });
    expect(query?.selected).toContain("artist_sales(");
    expect(query?.selected).not.toMatch(/\bsales\(/);
  });
});

describe("getArtistSales", () => {
  const row = {
    id: "sale1",
    catalogue_work_id: "w1",
    sale_price_cents: 150000,
    commission_rate: 0.4,
    commission_amount_cents: 60000,
    artist_amount_cents: 90000,
    sold_at: "2026-03-01T10:00:00Z",
    buyer_paid_at: null,
    payout_due_at: null,
    // Columns that must never reach the studio, even if the view returned them.
    buyer_name: "Bo",
    buyer_email: "bo@x.co",
    buyer_phone: "082",
  };

  it("reads from the artist_sales view scoped to artist and gallery", async () => {
    fake.on("artist_sales", "select", { data: [row], error: null });
    await q.getArtistSales(db, "a1", "g1", ZAR);
    const query = fake.last("artist_sales");
    expect(filter(query, "artist_id")).toBe("a1");
    expect(filter(query, "gallery_id")).toBe("g1");
    expect(fake.queries.some((x) => x.table === "sales")).toBe(false);
  });

  it("maps amounts and never exposes buyer identity", async () => {
    fake.on("artist_sales", "select", { data: [row], error: null });
    const [s] = await q.getArtistSales(db, "a1", "g1", ZAR);
    expect(s).toMatchObject({
      salePrice: formatCurrency(1500, ZAR),
      commissionRatePct: 40,
      commissionAmount: formatCurrency(600, ZAR),
      artistAmount: formatCurrency(900, ZAR),
      buyerPaidDate: "—",
      payoutDueDate: "—",
    });
    const json = JSON.stringify(s);
    expect(json).not.toContain("Bo");
    expect(json).not.toContain("bo@x.co");
    expect(json).not.toContain("082");
  });
});

describe("getGalleryArtists", () => {
  it("de-duplicates artists and sorts by name", async () => {
    fake.on("submissions", "select", {
      data: [
        { artist_id: "a2", artist_profiles: { full_name: "Zed" } },
        { artist_id: "a1", artist_profiles: { full_name: "Ana" } },
        { artist_id: "a2", artist_profiles: { full_name: "Zed" } },
        { artist_id: "a3", artist_profiles: null },
      ],
      error: null,
    });
    expect(await q.getGalleryArtists(db, "g1")).toEqual([
      { id: "a1", name: "Ana" },
      { id: "a3", name: "Unknown artist" },
      { id: "a2", name: "Zed" },
    ]);
  });
});

describe("getFrameJobs", () => {
  it("labels ready jobs as done and uses placeholders", async () => {
    fake.on("frame_jobs", "select", {
      data: [
        { title: "A", artist_profiles: { full_name: "Ana" }, spec: "oak", stage: "ready", due_date: "2026-03-01" },
        { title: "B", artist_profiles: null, spec: null, stage: "cutting", due_date: "2026-03-02" },
        { title: "C", artist_profiles: null, spec: null, stage: "ordered", due_date: null },
      ],
      error: null,
    });
    const jobs = await q.getFrameJobs(db, "g1");
    expect(jobs[0].due).toBe(`Done · ${shortDate("2026-03-01")}`);
    expect(jobs[1]).toMatchObject({ due: shortDate("2026-03-02"), artist: "Unknown artist", spec: "" });
    expect(jobs[2].due).toBe("—");
  });
});

describe("getContacts", () => {
  it("maps contacts and handles never-contacted ones", async () => {
    fake.on("contacts", "select", {
      data: [
        { id: "c1", name: "Pat", email: "p@x.co", role: "Artist", focus: null, last_contact_at: null },
        { id: "c2", name: "Sam", email: "s@x.co", role: "Collector", focus: "Prints", last_contact_at: new Date().toISOString() },
      ],
      error: null,
    });
    const [a, b] = await q.getContacts(db, "g1");
    expect(a).toMatchObject({ focus: "", last: "—" });
    expect(b).toMatchObject({ focus: "Prints", last: "Today" });
    expect(fake.last("contacts")?.orderBy[0]).toEqual(["last_contact_at", { ascending: false, nullsFirst: false }]);
  });
});

describe("getAuditLog", () => {
  const entry = (over: Record<string, unknown>) => ({
    id: "x",
    table_name: "exhibitions",
    action: "insert",
    record_id: "r1",
    record: {},
    old_record: null,
    actor_email: "me@x.co",
    created_at: new Date().toISOString(),
    ...over,
  });

  it("requests the limit and labels entities and records", async () => {
    fake.on("audit_log", "select", {
      data: [
        entry({ id: "1", table_name: "contacts", record: { name: "Pat" } }),
        entry({ id: "2", table_name: "other_table", record: {}, actor_email: null }),
      ],
      error: null,
    });
    const [a, b] = await q.getAuditLog(db, "g1", 25);
    expect(fake.last("audit_log")?.limit).toBe(25);
    expect(a).toMatchObject({ entity: "Contact", label: "Pat", actorEmail: "me@x.co", when: "Today" });
    expect(b).toMatchObject({ entity: "other_table", label: "Untitled", actorEmail: "Unknown" });
  });

  it("defaults to 200 entries", async () => {
    await q.getAuditLog(db, "g1");
    expect(fake.last("audit_log")?.limit).toBe(200);
  });

  it("lists filled fields for inserts and hides bookkeeping columns", async () => {
    fake.on("audit_log", "select", {
      data: [
        entry({
          record: { id: "r1", gallery_id: "g1", created_at: "t", updated_at: "t", title: "Spring", blurb: "", slots: 5, medium_requirements: null },
        }),
      ],
      error: null,
    });
    const [e] = await q.getAuditLog(db, "g1");
    expect(e.changes).toEqual([
      { field: "Title", from: null, to: "Spring" },
      { field: "Slots", from: null, to: "5" },
    ]);
  });

  it("lists filled fields as removed for deletes", async () => {
    fake.on("audit_log", "select", {
      data: [entry({ action: "delete", record: { title: "Gone", slots: 5 } })],
      error: null,
    });
    const [e] = await q.getAuditLog(db, "g1");
    expect(e.changes).toEqual([
      { field: "Title", from: "Gone", to: null },
      { field: "Slots", from: "5", to: null },
    ]);
  });

  it("diffs updates against old_record, ignoring unchanged and equivalent-empty fields", async () => {
    fake.on("audit_log", "select", {
      data: [
        entry({
          action: "update",
          record: { title: "New", slots: 5, blurb: "", theme: "x" },
          old_record: { title: "Old", slots: 5, blurb: null, theme: null },
        }),
      ],
      error: null,
    });
    const [e] = await q.getAuditLog(db, "g1");
    expect(e.changes).toEqual([
      { field: "Title", from: "Old", to: "New" },
      { field: "Theme", from: null, to: "x" },
    ]);
  });

  it("falls back to the next-older entry for the same record when old_record is missing", async () => {
    fake.on("audit_log", "select", {
      data: [
        entry({ id: "newest", action: "update", record: { title: "C" }, old_record: null }),
        entry({ id: "other", record_id: "r2", record: { title: "Z" } }),
        entry({ id: "older", action: "update", record: { title: "B" }, old_record: null }),
      ],
      error: null,
    });
    const [newest] = await q.getAuditLog(db, "g1");
    expect(newest.changes).toEqual([{ field: "Title", from: "B", to: "C" }]);
  });

  it("returns no changes for an update with nothing to compare against", async () => {
    fake.on("audit_log", "select", { data: [entry({ action: "update", record: { title: "A" } })], error: null });
    expect((await q.getAuditLog(db, "g1"))[0].changes).toEqual([]);
  });

  it("serialises object values as JSON", async () => {
    fake.on("audit_log", "select", { data: [entry({ record: { tags: ["a"] } })], error: null });
    expect((await q.getAuditLog(db, "g1"))[0].changes).toEqual([{ field: "Tags", from: null, to: '["a"]' }]);
  });
});

describe("getArtistWorks", () => {
  it("is scoped to artist and gallery and maps nullable fields", async () => {
    fake.on("submissions", "select", {
      data: [
        { id: "s1", title: "A", year: null, medium: null, status: "pending", created_at: new Date().toISOString(), note: "", ack: null, dim: null, price: null, statement: null, image_url: null },
        { id: "s2", title: "B", year: 2024, medium: "Oil", status: "accepted", created_at: new Date().toISOString(), note: "nice", ack: true, dim: "1x1", price: "99", statement: "s", image_url: "u" },
      ],
      error: null,
    });
    const [a, b] = await q.getArtistWorks(db, "a1", "g1");
    const query = fake.last("submissions");
    expect(filter(query, "artist_id")).toBe("a1");
    expect(filter(query, "gallery_id")).toBe("g1");
    expect(a).toMatchObject({ year: 0, medium: "", note: undefined, price: null, statement: "", imageUrl: undefined, ack: undefined });
    expect(b).toMatchObject({ price: 99, note: "nice", ack: true, imageUrl: "u" });
  });
});

describe("getOpenCalls", () => {
  const base = {
    id: "e1",
    title: "Spring",
    type: "open_call",
    submission_deadline: "2999-05-01",
    blurb: null,
    theme: null,
    medium_requirements: null,
    size_requirements: null,
    rules: null,
  };

  it("excludes archived and only accepts open or planning exhibitions", async () => {
    fake.on("exhibitions", "select", {
      data: [
        { ...base, status: "open" },
        { ...base, id: "e2", status: "planning", submission_deadline: null },
        { ...base, id: "e3", status: "closed" },
      ],
      error: null,
    });
    const calls = await q.getOpenCalls(db, "g1", "Woza");
    expect(filter(fake.last("exhibitions"), "status!=")).toBe("archived");
    expect(calls.map((c) => c.accepting)).toEqual([true, true, false]);
    expect(calls[0]).toMatchObject({ gallery: "Woza", deadline: shortDate("2999-05-01"), focus: "" });
    expect(calls[1].deadline).toBe("Closed");
  });

  it("stops accepting once the submission deadline has passed", async () => {
    fake.on("exhibitions", "select", {
      data: [{ ...base, status: "open", submission_deadline: "2020-01-01" }],
      error: null,
    });
    const calls = await q.getOpenCalls(db, "g1", "Woza");
    expect(calls[0].accepting).toBe(false);
  });
});

describe("getMessages", () => {
  it("attributes gallery messages to the gallery and others to 'You'", async () => {
    fake.on("messages", "select", {
      data: [
        { id: "m1", sender: "gallery", created_at: new Date().toISOString(), subject: "Hi", body: "Body" },
        { id: "m2", sender: "artist", created_at: new Date().toISOString(), subject: "Re", body: "Reply" },
      ],
      error: null,
    });
    const [a, b] = await q.getMessages(db, "a1", "g1", "Woza");
    expect(a).toMatchObject({ from: "Woza", preview: "Hi", body: "Body", time: "Today" });
    expect(b.from).toBe("You");
    expect(filter(fake.last("messages"), "artist_id")).toBe("a1");
  });
});

describe("artist profile and bank details", () => {
  it("returns the row when found", async () => {
    fake.on("artist_profiles", "select", { data: { id: "a1", full_name: "Ana" }, error: null });
    fake.on("artist_bank_details", "select", { data: { id: "a1", bank_name: "FNB" }, error: null });
    expect(await q.getArtistProfile(db, "a1")).toEqual({ id: "a1", full_name: "Ana" });
    expect(await q.getArtistBankDetails(db, "a1")).toEqual({ id: "a1", bank_name: "FNB" });
    expect(filter(fake.last("artist_bank_details"), "id")).toBe("a1");
  });

  it("returns null on error instead of throwing", async () => {
    fake.on("artist_profiles", "select", { data: null, error: dbError });
    fake.on("artist_bank_details", "select", { data: null, error: dbError });
    expect(await q.getArtistProfile(db, "a1")).toBeNull();
    expect(await q.getArtistBankDetails(db, "a1")).toBeNull();
  });
});

describe("getPayoutProofUrl", () => {
  it("returns a 60 second signed URL from the payout-proofs bucket", async () => {
    fake.on("payouts", "select", { data: { proof_of_payment_path: "a/b.pdf" }, error: null });
    expect(await q.getPayoutProofUrl(db, "p1")).toBe("https://signed.test/x");
    expect(fake.signedUrls).toEqual([{ bucket: "payout-proofs", path: "a/b.pdf", ttl: 60 }]);
    expect(filter(fake.last("payouts"), "id")).toBe("p1");
  });

  it("returns null when the payout lookup fails or has no proof, without signing", async () => {
    fake.on("payouts", "select", { data: null, error: dbError });
    expect(await q.getPayoutProofUrl(db, "p1")).toBeNull();
    fake.on("payouts", "select", { data: { proof_of_payment_path: null }, error: null });
    expect(await q.getPayoutProofUrl(db, "p1")).toBeNull();
    expect(fake.signedUrls).toEqual([]);
  });

  it("returns null when signing fails", async () => {
    fake.on("payouts", "select", { data: { proof_of_payment_path: "a/b.pdf" }, error: null });
    fake.state.signedUrlResult = { data: null, error: dbError };
    expect(await q.getPayoutProofUrl(db, "p1")).toBeNull();
  });
});
