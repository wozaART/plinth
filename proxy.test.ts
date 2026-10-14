import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

type Maybe = { data: unknown };

const h = vi.hoisted(() => ({
  customDomainResult: { data: null } as { data: unknown },
  ownedGalleryResult: { data: null } as { data: unknown },
  user: null as null | { id: string; user_metadata?: Record<string, unknown> },
  domainFilters: [] as [string, unknown][],
  createSupabaseClient: vi.fn(),
  response: null as unknown,
}));

// Platform lookup client used by resolveGallerySlug (custom-domain match).
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => {
    h.createSupabaseClient(...args);
    const b = {
      select: () => b,
      eq: (c: string, v: unknown) => {
        h.domainFilters.push([c, v]);
        return b;
      },
      maybeSingle: () => Promise.resolve(h.customDomainResult as Maybe),
    };
    return { from: () => b };
  },
}));

// Session client used for auth and the owned-gallery lookup.
vi.mock("@/utils/supabase/middleware", () => ({
  createClient: () => {
    const b = { select: () => b, eq: () => b, maybeSingle: () => Promise.resolve(h.ownedGalleryResult as Maybe) };
    return {
      supabase: { auth: { getUser: async () => ({ data: { user: h.user } }) }, from: () => b },
      supabaseResponse: () => h.response,
    };
  },
}));

async function loadProxy() {
  vi.resetModules();
  return (await import("./proxy")).proxy;
}

function req(path: string, host: string | null = "localhost:3000") {
  const headers: Record<string, string> = host ? { host } : {};
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

const pass = NextResponse.next();

beforeEach(() => {
  h.customDomainResult = { data: null };
  h.ownedGalleryResult = { data: null };
  h.user = null;
  h.domainFilters = [];
  h.createSupabaseClient.mockClear();
  h.response = pass;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk_test");
  vi.stubEnv("NEXT_PUBLIC_PLATFORM_APEX_DOMAIN", "woza.art");
  vi.stubEnv("DEFAULT_GALLERY_SLUG", "");
  delete process.env.DEFAULT_GALLERY_SLUG;
});

afterEach(() => vi.unstubAllEnvs());

/** Runs the proxy and returns the slug it stamped on the request. */
async function slugFor(host: string | null) {
  const proxy = await loadProxy();
  const request = req("/", host);
  await proxy(request);
  return request.headers.get("x-gallery-slug");
}

describe("gallery resolution", () => {
  it("uses a verified custom domain's gallery", async () => {
    h.customDomainResult = { data: { slug: "sunset" } };
    expect(await slugFor("art.sunset.co.za")).toBe("sunset");
    expect(h.domainFilters).toEqual([
      ["custom_domain", "art.sunset.co.za"],
      ["domain_status", "verified"],
    ]);
  });

  it("strips the port before matching the custom domain", async () => {
    h.customDomainResult = { data: { slug: "sunset" } };
    await slugFor("art.sunset.co.za:8443");
    expect(h.domainFilters[0]).toEqual(["custom_domain", "art.sunset.co.za"]);
  });

  it("ignores unverified custom domains (the query only matches verified ones)", async () => {
    // domain_status is part of the filter, so an unverified row yields no data.
    h.customDomainResult = { data: null };
    expect(await slugFor("art.sunset.co.za")).toBe("default");
    expect(h.domainFilters).toContainEqual(["domain_status", "verified"]);
  });

  it("resolves <slug>.<apex> subdomains", async () => {
    expect(await slugFor("sunset.woza.art")).toBe("sunset");
    expect(await slugFor("sunset.woza.art:3000")).toBe("sunset");
  });

  it("prefers a verified custom domain over the subdomain pattern", async () => {
    h.customDomainResult = { data: { slug: "other" } };
    expect(await slugFor("sunset.woza.art")).toBe("other");
  });

  it("falls back to the default for the bare apex", async () => {
    expect(await slugFor("woza.art")).toBe("default");
  });

  it("rejects nested subdomains of the apex", async () => {
    expect(await slugFor("a.b.woza.art")).toBe("default");
  });

  it("doesn't treat look-alike hosts as subdomains", async () => {
    expect(await slugFor("sunsetwoza.art")).toBe("default");
    expect(await slugFor("sunset.woza.art.evil.com")).toBe("default");
  });

  it("falls back to the default for localhost and preview URLs", async () => {
    expect(await slugFor("localhost:3000")).toBe("default");
    expect(await slugFor("plinth-git-x.vercel.app")).toBe("default");
  });

  it("falls back to the default when there is no host header", async () => {
    expect(await slugFor(null)).toBe("default");
    expect(h.createSupabaseClient).not.toHaveBeenCalled();
  });

  it("honours DEFAULT_GALLERY_SLUG", async () => {
    vi.stubEnv("DEFAULT_GALLERY_SLUG", "flagship");
    expect(await slugFor("localhost:3000")).toBe("flagship");
    expect(await slugFor(null)).toBe("flagship");
  });

  it("skips the custom-domain lookup when Supabase env vars are missing, but still resolves subdomains", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    h.customDomainResult = { data: { slug: "never" } };
    expect(await slugFor("art.sunset.co.za")).toBe("default");
    expect(await slugFor("sunset.woza.art")).toBe("sunset");
    expect(h.createSupabaseClient).not.toHaveBeenCalled();
  });

  it("ignores subdomains when no apex domain is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_PLATFORM_APEX_DOMAIN", "");
    expect(await slugFor("sunset.woza.art")).toBe("default");
  });
});

describe("route protection", () => {
  it.each(["/dashboard", "/dashboard/settings", "/studio", "/studio/works"])(
    "redirects anonymous visitors from %s to /signin",
    async (path) => {
      const proxy = await loadProxy();
      const res = await proxy(req(path));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/signin");
    },
  );

  it.each(["/", "/signin", "/docs", "/forms/lay-by", "/consignment-terms", "/demo/gallery"])(
    "lets anonymous visitors through to public path %s",
    async (path) => {
      const proxy = await loadProxy();
      expect(await proxy(req(path))).toBe(pass);
    },
  );

  it("lets signed-in users through to protected paths", async () => {
    h.user = { id: "u1" };
    const proxy = await loadProxy();
    expect(await proxy(req("/dashboard"))).toBe(pass);
    expect(await proxy(req("/studio"))).toBe(pass);
  });

  it("returns the session response so refreshed auth cookies are kept", async () => {
    const refreshed = NextResponse.next();
    h.response = refreshed;
    const proxy = await loadProxy();
    expect(await proxy(req("/"))).toBe(refreshed);
  });
});

describe("signed-in visits to /signin", () => {
  async function landing(path = "/signin") {
    const proxy = await loadProxy();
    const res = await proxy(req(path));
    return res === pass ? "pass" : new URL(res.headers.get("location")!).pathname;
  }

  it("sends gallery users to the dashboard", async () => {
    h.user = { id: "u1", user_metadata: { role: "gallery" } };
    expect(await landing()).toBe("/dashboard");
  });

  it("sends users with no role to the dashboard", async () => {
    h.user = { id: "u1" };
    expect(await landing()).toBe("/dashboard");
  });

  it("sends artists to the studio", async () => {
    h.user = { id: "u1", user_metadata: { role: "artist" } };
    expect(await landing()).toBe("/studio");
  });

  it("sends artists who also own a gallery to the dashboard", async () => {
    h.user = { id: "u1", user_metadata: { role: "artist" } };
    h.ownedGalleryResult = { data: { id: "g1" } };
    expect(await landing()).toBe("/dashboard");
  });

  it.each(["?invite=abc", "?exhibition_invite=xyz"])("doesn't redirect away when %s is present", async (qs) => {
    h.user = { id: "u1", user_metadata: { role: "artist" } };
    expect(await landing(`/signin${qs}`)).toBe("pass");
  });
});

describe("matcher config", () => {
  it("skips static assets and images but matches app routes", async () => {
    const { config } = await import("./proxy");
    const re = new RegExp(`^${config.matcher[0]}$`);
    for (const p of ["/", "/dashboard", "/signin", "/api/x", "/forms/lay-by"]) expect(re.test(p), p).toBe(true);
    for (const p of ["/_next/static/a.js", "/_next/image", "/favicon.ico", "/logo.svg", "/a/b.png", "/x.webp"]) {
      expect(re.test(p), p).toBe(false);
    }
  });
});
