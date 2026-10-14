import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDomainToProject, dnsInstructionsFor, getDomainStatus, removeDomainFromProject } from "./domains";

const fetchMock = vi.fn();

function reply(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: url as string, init: init as RequestInit & { headers: Record<string, string> } };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VERCEL_TOKEN", "tok_123");
  vi.stubEnv("VERCEL_PROJECT_ID", "prj_abc");
  vi.stubEnv("VERCEL_TEAM_ID", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("dnsInstructionsFor", () => {
  it("points an apex domain at Vercel with an A record", () => {
    expect(dnsInstructionsFor("example.com")).toEqual([{ type: "A", name: "@", value: "76.76.21.21" }]);
  });

  it("points a subdomain at Vercel with a CNAME using the leftmost label as the host", () => {
    expect(dnsInstructionsFor("art.example.com")).toEqual([
      { type: "CNAME", name: "art", value: "cname.vercel-dns.com" },
    ]);
  });

  it("treats deeper subdomains as CNAMEs on their first label", () => {
    expect(dnsInstructionsFor("shop.art.example.com")).toEqual([
      { type: "CNAME", name: "shop", value: "cname.vercel-dns.com" },
    ]);
  });
});

describe("addDomainToProject", () => {
  it("POSTs the domain name to the project's domains endpoint with a bearer token", async () => {
    fetchMock.mockResolvedValue(reply({ name: "art.example.com" }));
    await addDomainToProject("art.example.com");
    const { url, init } = lastCall();
    expect(url).toBe("https://api.vercel.com/v10/projects/prj_abc/domains");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "art.example.com" }));
    expect(init.headers.Authorization).toBe("Bearer tok_123");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("appends the team id, URL-encoded, when configured", async () => {
    vi.stubEnv("VERCEL_TEAM_ID", "team a/b");
    fetchMock.mockResolvedValue(reply({}));
    await addDomainToProject("art.example.com");
    expect(lastCall().url).toBe("https://api.vercel.com/v10/projects/prj_abc/domains?teamId=team%20a%2Fb");
  });

  it("throws Vercel's error message on a non-2xx response", async () => {
    fetchMock.mockResolvedValue(reply({ error: { message: "Domain is already in use" } }, 409));
    await expect(addDomainToProject("art.example.com")).rejects.toThrow("Domain is already in use");
  });

  it("falls back to the status code when the error body has no message", async () => {
    fetchMock.mockResolvedValue(reply({}, 500));
    await expect(addDomainToProject("art.example.com")).rejects.toThrow("Vercel API error (500)");
  });

  it("falls back to the status code when the error body isn't JSON", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => Promise.reject(new SyntaxError("bad")) });
    await expect(addDomainToProject("art.example.com")).rejects.toThrow("Vercel API error (502)");
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(addDomainToProject("art.example.com")).rejects.toThrow("fetch failed");
  });
});

describe("removeDomainFromProject", () => {
  it("DELETEs the domain from the project", async () => {
    fetchMock.mockResolvedValue(reply({}));
    await removeDomainFromProject("art.example.com");
    const { url, init } = lastCall();
    expect(url).toBe("https://api.vercel.com/v9/projects/prj_abc/domains/art.example.com");
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toBe("Bearer tok_123");
  });

  it("includes the team id when configured", async () => {
    vi.stubEnv("VERCEL_TEAM_ID", "team_1");
    fetchMock.mockResolvedValue(reply({}));
    await removeDomainFromProject("art.example.com");
    expect(lastCall().url).toBe("https://api.vercel.com/v9/projects/prj_abc/domains/art.example.com?teamId=team_1");
  });

  it("throws on a non-2xx response", async () => {
    fetchMock.mockResolvedValue(reply({ error: { message: "Not found" } }, 404));
    await expect(removeDomainFromProject("art.example.com")).rejects.toThrow("Not found");
  });
});

describe("getDomainStatus", () => {
  function respond(domainInfo: unknown, config: unknown) {
    fetchMock.mockImplementation(async (url: string) =>
      reply(url.includes("/v6/domains/") ? config : domainInfo),
    );
  }

  it("queries the project domain and the DNS config, both with the team id", async () => {
    vi.stubEnv("VERCEL_TEAM_ID", "team_1");
    respond({ verified: true }, { misconfigured: false });
    await getDomainStatus("art.example.com");
    const urls = fetchMock.mock.calls.map(([u]) => u);
    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://api.vercel.com/v9/projects/prj_abc/domains/art.example.com?teamId=team_1");
    expect(urls).toContain("https://api.vercel.com/v6/domains/art.example.com/config?teamId=team_1");
  });

  it("reports a verified, correctly configured domain", async () => {
    respond({ verified: true }, { misconfigured: false });
    expect(await getDomainStatus("art.example.com")).toEqual({ verified: true, misconfigured: false, challenges: [] });
  });

  it("reports an unverified domain with its verification challenges", async () => {
    respond(
      {
        verified: false,
        verification: [{ type: "TXT", domain: "_vercel.example.com", value: "vc-domain-verify=abc", reason: "pending_domain_verification", extra: "dropped" }],
      },
      { misconfigured: false },
    );
    expect(await getDomainStatus("art.example.com")).toEqual({
      verified: false,
      misconfigured: false,
      challenges: [
        { type: "TXT", domain: "_vercel.example.com", value: "vc-domain-verify=abc", reason: "pending_domain_verification" },
      ],
    });
  });

  it("reports a misconfigured domain", async () => {
    respond({ verified: true }, { misconfigured: true });
    expect(await getDomainStatus("art.example.com")).toMatchObject({ verified: true, misconfigured: true });
  });

  it("treats missing fields as false and no challenges", async () => {
    respond({}, {});
    expect(await getDomainStatus("art.example.com")).toEqual({ verified: false, misconfigured: false, challenges: [] });
  });

  it("throws if either request fails", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes("/v6/domains/") ? reply({ error: { message: "Forbidden" } }, 403) : reply({ verified: true }),
    );
    await expect(getDomainStatus("art.example.com")).rejects.toThrow("Forbidden");
  });
});

describe("configuration", () => {
  it.each([
    ["VERCEL_TOKEN", ""],
    ["VERCEL_PROJECT_ID", ""],
  ])("throws a helpful error without calling Vercel when %s is unset", async (name, value) => {
    vi.stubEnv(name, value);
    const message = /Custom domains aren't configured on this deployment/;
    await expect(addDomainToProject("a.example.com")).rejects.toThrow(message);
    await expect(removeDomainFromProject("a.example.com")).rejects.toThrow(message);
    await expect(getDomainStatus("a.example.com")).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
