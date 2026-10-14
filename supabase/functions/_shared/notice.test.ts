import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV, fakeSupabase } from "../../../test/edge";

const supabaseModule = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("npm:@supabase/supabase-js@2", () => supabaseModule);

import { authenticate, formatDate, formatRand, getArtistEmail, renderNoticeEmail, type NoticeEmailParams } from "./notice.ts";

afterEach(() => vi.unstubAllGlobals());

const base: NoticeEmailParams = {
  galleryName: "Gallery One",
  accentColor: "#c2410c",
  eyebrow: "Sale recorded",
  heading: "Work has sold",
  greetingName: "Thandi",
  paragraphs: ["First paragraph.", "Second paragraph."],
  rows: [
    { label: "Work", value: "Sunrise" },
    { label: "Payout", value: "R 100,00" },
  ],
  ctaLabel: "View earnings",
  ctaUrl: "https://app.test/studio",
  appUrl: "https://app.test",
};

describe("formatRand", () => {
  it("formats cents as South African rand", () => {
    expect(formatRand(123456).replace(/\s/g, " ")).toMatch(/^R 1 234,56$/);
  });

  it("formats zero", () => {
    expect(formatRand(0).replace(/\s/g, " ")).toBe("R 0,00");
  });
});

describe("formatDate", () => {
  it("renders a long US-style date", () => {
    expect(formatDate("2026-03-15T12:00:00Z")).toBe("March 15, 2026");
  });

  it("renders an em dash for a missing date", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("renderNoticeEmail", () => {
  it("includes the heading, greeting, paragraphs, rows and CTA", () => {
    const html = renderNoticeEmail(base);
    expect(html).toContain("<title>Work has sold</title>");
    expect(html).toContain("Hi Thandi,");
    expect(html).toContain("First paragraph.");
    expect(html).toContain("Second paragraph.");
    expect(html).toContain("Sunrise");
    expect(html).toContain("R 100,00");
    expect(html).toContain('href="https://app.test/studio"');
    expect(html).toContain("View earnings");
  });

  it("greets a nameless recipient with 'there'", () => {
    expect(renderNoticeEmail({ ...base, greetingName: "" })).toContain("Hi there,");
  });

  it("escapes HTML in every user-supplied field", () => {
    const html = renderNoticeEmail({
      ...base,
      galleryName: "<b>G</b>",
      heading: "<script>x</script>",
      greetingName: "<i>T</i>",
      paragraphs: ["<u>p</u>"],
      rows: [{ label: "<l>", value: "<v>" }],
      ctaLabel: "<c>",
      ctaUrl: 'https://a.test/"onmouseover="x',
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>G</b>");
    expect(html).not.toContain("<u>p</u>");
    expect(html).not.toContain("<v>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).toContain("https://a.test/&quot;onmouseover=&quot;x");
  });

  it("uses a valid hex accent colour", () => {
    expect(renderNoticeEmail(base)).toContain("background-color:#c2410c");
  });

  it.each(["", "red", 'red"; x:y', "#12", "url(javascript:x)"])("falls back to ink for the unsafe accent %j", (accent) => {
    const html = renderNoticeEmail({ ...base, accentColor: accent });
    expect(html).toContain("background-color:#1c1a17;");
  });

  it("shows the app URL without its scheme in the footer", () => {
    expect(renderNoticeEmail(base)).toContain(">app.test</a>");
  });
});

describe("authenticate", () => {
  function setup(user: { id: string } | null) {
    vi.stubGlobal("Deno", { env: { get: (key: string) => ENV[key] } });
    const fake = fakeSupabase({ user, tables: {}, adminUser: { data: { user: null }, error: null } });
    supabaseModule.createClient.mockImplementation(fake.createClient);
    return fake;
  }

  it("rejects a request with no Authorization header", async () => {
    const fake = setup({ id: "u1" });
    expect(await authenticate(new Request("http://fn.test"))).toBeNull();
    expect(fake.createClient).not.toHaveBeenCalled();
  });

  it("rejects a JWT that doesn't resolve to a user", async () => {
    setup(null);
    expect(await authenticate(new Request("http://fn.test", { headers: { Authorization: "Bearer bad" } }))).toBeNull();
  });

  it("returns the user and a client scoped to the caller's JWT", async () => {
    const fake = setup({ id: "u1" });
    const auth = await authenticate(new Request("http://fn.test", { headers: { Authorization: "Bearer good" } }));
    expect(auth?.user).toEqual({ id: "u1" });
    expect(fake.createClient).toHaveBeenCalledWith(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: "Bearer good" } },
    });
  });
});

describe("getArtistEmail", () => {
  function setup(adminUser: { data: { user: { email?: string | null } | null }; error: unknown }) {
    vi.stubGlobal("Deno", { env: { get: (key: string) => ENV[key] } });
    const fake = fakeSupabase({ user: null, tables: {}, adminUser });
    supabaseModule.createClient.mockImplementation(fake.createClient);
    return fake;
  }

  it("looks the artist up with the service-role key", async () => {
    const fake = setup({ data: { user: { email: "a@test.dev" } }, error: null });
    expect(await getArtistEmail("artist-1")).toBe("a@test.dev");
    expect(fake.createClient).toHaveBeenCalledWith(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
    expect(fake.adminClient.auth.admin.getUserById).toHaveBeenCalledWith("artist-1");
  });

  it("returns null on a lookup error", async () => {
    setup({ data: { user: null }, error: new Error("nope") });
    expect(await getArtistEmail("artist-1")).toBeNull();
  });

  it("returns null when the user has no email", async () => {
    setup({ data: { user: { email: null } }, error: null });
    expect(await getArtistEmail("artist-1")).toBeNull();
    setup({ data: { user: null }, error: null });
    expect(await getArtistEmail("artist-1")).toBeNull();
  });
});
