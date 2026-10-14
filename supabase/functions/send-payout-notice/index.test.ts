import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FakeDb, fakeSupabase, loadHandler, request, sentEmail, stubResend } from "../../../test/edge";

const supabaseModule = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("npm:@supabase/supabase-js@2", () => supabaseModule);

const payout = {
  artist_id: "artist-1",
  amount_cents: 150000,
  status: "paid",
  paid_at: "2026-04-16T12:00:00Z",
  payment_reference: "EFT-123",
  proof_of_payment_path: "proofs/1.pdf",
  sales: { catalogue_works: { title: "Sunrise" } },
  galleries: { name: "Gallery One", theme_colors: { accent: "#c2410c" } },
};

function db(overrides: Partial<FakeDb> = {}): FakeDb {
  return {
    user: { id: "owner-1" },
    tables: { payouts: { data: payout }, artist_profiles: { data: { full_name: "Thandi" } } },
    adminUser: { data: { user: { email: "artist@test.dev" } }, error: null },
    ...overrides,
  };
}

async function setup(overrides: Partial<FakeDb> = {}, resend?: Response) {
  const fake = fakeSupabase(db(overrides));
  supabaseModule.createClient.mockImplementation(fake.createClient);
  const fetchMock = stubResend(resend);
  return { fake, fetchMock, handler: await loadHandler(() => import("./index.ts")) };
}

const payload = { payoutId: "payout-1", appUrl: "https://app.test" };

beforeEach(() => vi.unstubAllGlobals());

describe("send-payout-notice", () => {
  it("answers CORS preflight", async () => {
    const { handler } = await setup();
    const res = await handler(new Request("http://fn.test", { method: "OPTIONS" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("rejects a request without an Authorization header", async () => {
    const { handler, fetchMock } = await setup();
    expect((await handler(request(payload, {}))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a JWT that doesn't belong to a user", async () => {
    const { handler, fetchMock } = await setup({ user: null });
    expect((await handler(request(payload))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{ payoutId: "p" }, { appUrl: "https://app.test" }, {}])("rejects a payload missing fields: %j", async (body) => {
    const { handler } = await setup();
    expect((await handler(request(body))).status).toBe(400);
  });

  it("returns 404 when RLS hides the payout", async () => {
    const { handler } = await setup({ tables: { payouts: { data: null, error: { message: "no rows" } } } });
    expect((await handler(request(payload))).status).toBe(404);
  });

  it.each(["pending", "cancelled"])("returns 409 for a payout that is %s rather than paid", async (status) => {
    const { handler, fetchMock } = await setup({ tables: { payouts: { data: { ...payout, status } } } });
    expect((await handler(request(payload))).status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 422 when the artist has no email on file", async () => {
    const { handler, fetchMock } = await setup({ adminUser: { data: { user: null }, error: null } });
    expect((await handler(request(payload))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails the artist the payout details", async () => {
    const { handler, fetchMock } = await setup();
    const res = await handler(request(payload));
    expect(res.status).toBe(200);

    const { body } = sentEmail(fetchMock);
    expect(body.to).toEqual(["artist@test.dev"]);
    expect(body.subject).toMatch(/^Gallery One has paid you R\s?1\s?500,00$/);
    expect(body.html).toContain("Hi Thandi,");
    expect(body.html).toContain("Sunrise");
    expect(body.html).toContain("April 16, 2026");
    expect(body.html).toContain("EFT-123");
    expect(body.html).toContain("Available in your studio");
    expect(body.html).toContain("Confirm receipt");
    expect(body.html).toContain('href="https://app.test/studio"');
  });

  it("omits the reference and proof rows when the payout has neither", async () => {
    const bare = { ...payout, payment_reference: null, proof_of_payment_path: null };
    const { handler, fetchMock } = await setup({ tables: { payouts: { data: bare }, artist_profiles: { data: null } } });
    await handler(request(payload));
    const { body } = sentEmail(fetchMock);
    expect(body.html).not.toContain("Reference");
    expect(body.html).not.toContain("Proof of payment");
  });

  it("returns 502 with Resend's error when sending fails", async () => {
    const { handler } = await setup({}, new Response("rate limited", { status: 429 }));
    const res = await handler(request(payload));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("rate limited");
  });
});
