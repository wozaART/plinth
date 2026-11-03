import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMailDomain, deleteMailDomain, refreshMailDomain } from "./domains";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "key");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("Resend domains", () => {
  it("creates a sending-only domain and maps the records", async () => {
    fetchMock.mockReturnValue(
      reply({ id: "d1", status: "not_started", records: [{ record: "DKIM", type: "TXT", name: "resend._domainkey", value: "p=abc", ttl: "Auto", status: "not_started" }] }),
    );

    const domain = await createMailDomain("gallery.example.com");

    expect(domain).toEqual({ id: "d1", status: "pending", records: [{ type: "TXT", name: "resend._domainkey", value: "p=abc", priority: undefined }] });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/domains");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer key");
    expect(JSON.parse(init.body as string)).toEqual({ name: "gallery.example.com", capabilities: { sending: "enabled", receiving: "disabled" } });
  });

  it("verifies, then reads back the domain", async () => {
    fetchMock.mockReturnValueOnce(reply({})).mockReturnValueOnce(reply({ id: "d1", status: "verified", records: [] }));

    expect((await refreshMailDomain("d1")).status).toBe("verified");
    expect(fetchMock.mock.calls.map(c => (c as [string])[0])).toEqual([
      "https://api.resend.com/domains/d1/verify",
      "https://api.resend.com/domains/d1",
    ]);
  });

  it("maps a failed domain to error", async () => {
    fetchMock.mockReturnValueOnce(reply({})).mockReturnValueOnce(reply({ id: "d1", status: "failed", records: [] }));
    expect((await refreshMailDomain("d1")).status).toBe("error");
  });

  it("surfaces Resend's error message", async () => {
    fetchMock.mockReturnValue(reply({ message: "Domain already registered" }, 403));
    await expect(createMailDomain("x.com")).rejects.toThrow("Domain already registered");
  });

  it("deletes a domain", async () => {
    fetchMock.mockReturnValue(reply({}));
    await deleteMailDomain("d1");
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe("DELETE");
  });

  it("treats a domain Resend no longer has as already deleted", async () => {
    fetchMock.mockReturnValue(reply({ message: "Domain not found" }, 404));
    await expect(deleteMailDomain("d1")).resolves.toBeUndefined();
  });

  it("still throws other delete failures", async () => {
    fetchMock.mockReturnValue(reply({ message: "Internal error" }, 500));
    await expect(deleteMailDomain("d1")).rejects.toThrow("Internal error");
  });

  it("explains a missing API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(createMailDomain("x.com")).rejects.toThrow("RESEND_API_KEY");
  });
});
