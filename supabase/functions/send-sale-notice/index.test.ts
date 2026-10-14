import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FakeDb, fakeSupabase, loadHandler, request, sentEmail, stubResend } from "../../../test/edge";

const supabaseModule = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("npm:@supabase/supabase-js@2", () => supabaseModule);

const sale = {
  artist_id: "artist-1",
  artist_amount_cents: 150000,
  sold_at: "2026-03-15T12:00:00Z",
  payout_due_at: "2026-04-15T12:00:00Z",
  catalogue_works: { title: "Sunrise" },
  galleries: { name: "Gallery One", theme_colors: { accent: "#c2410c" } },
};

function db(overrides: Partial<FakeDb> = {}): FakeDb {
  return {
    user: { id: "owner-1" },
    tables: { sales: { data: sale }, artist_profiles: { data: { full_name: "Thandi" } } },
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

const payload = { saleId: "sale-1", appUrl: "https://app.test/" };

beforeEach(() => vi.unstubAllGlobals());

describe("send-sale-notice", () => {
  it("answers CORS preflight without authenticating", async () => {
    const { handler, fetchMock } = await setup();
    const res = await handler(new Request("http://fn.test", { method: "OPTIONS" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request without an Authorization header", async () => {
    const { handler, fetchMock } = await setup();
    const res = await handler(request(payload, {}));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a JWT that doesn't belong to a user", async () => {
    const { handler, fetchMock } = await setup({ user: null });
    expect((await handler(request(payload))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{ saleId: "s" }, { appUrl: "https://app.test" }, {}])("rejects a payload missing fields: %j", async (body) => {
    const { handler, fetchMock } = await setup();
    expect((await handler(request(body))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when RLS hides the sale", async () => {
    const { handler, fetchMock } = await setup({ tables: { sales: { data: null, error: { message: "no rows" } } } });
    expect((await handler(request(payload))).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 422 when the artist has no email on file", async () => {
    const { handler, fetchMock } = await setup({ adminUser: { data: { user: { email: null } }, error: null } });
    const res = await handler(request(payload));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/no email address/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails the artist the sale details read back from the database", async () => {
    const { handler, fetchMock } = await setup();
    const res = await handler(request(payload));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const { body, headers } = sentEmail(fetchMock);
    expect(headers.Authorization).toBe("Bearer resend-key");
    expect(body.to).toEqual(["artist@test.dev"]);
    expect(body.subject).toBe('"Sunrise" has sold');
    expect(body.html).toContain("Hi Thandi,");
    expect(body.html).toContain("Sunrise");
    expect(body.html).toContain("March 15, 2026");
    expect(body.html).toContain("April 15, 2026");
    expect(body.html).toMatch(/R\s?1\s?500,00/);
    expect(body.html).toContain('href="https://app.test/studio"');
    expect(body.html).toContain("background-color:#c2410c");
  });

  it("never includes buyer details", async () => {
    const withBuyer = { ...sale, buyer_name: "Bianca Buyer", buyer_email: "bianca@test.dev", buyer_phone: "0821234567" };
    const { handler, fetchMock } = await setup({ tables: { sales: { data: withBuyer }, artist_profiles: { data: null } } });
    await handler(request(payload));
    const { body } = sentEmail(fetchMock);
    expect(body.html).not.toContain("Bianca");
    expect(body.html).not.toContain("bianca@test.dev");
    expect(body.html).not.toContain("0821234567");
  });

  it("falls back to a generic greeting when the artist has no profile", async () => {
    const { handler, fetchMock } = await setup({ tables: { sales: { data: sale }, artist_profiles: { data: null } } });
    await handler(request(payload));
    expect(sentEmail(fetchMock).body.html).toContain("Hi there,");
  });

  it("returns 502 with Resend's error when sending fails", async () => {
    const { handler } = await setup({}, new Response("bad domain", { status: 422 }));
    const res = await handler(request(payload));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("bad domain");
  });

  it("returns 500 on an unparseable body", async () => {
    const { handler } = await setup();
    const res = await handler(new Request("http://fn.test", { method: "POST", headers: { Authorization: "Bearer jwt" }, body: "not json" }));
    expect(res.status).toBe(500);
  });
});
