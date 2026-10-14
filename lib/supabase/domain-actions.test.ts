import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  revalidatePath: vi.fn(),
  gallery: { id: "gal-1", custom_domain: null as string | null },
  addDomainToProject: vi.fn(),
  removeDomainFromProject: vi.fn(),
  getDomainStatus: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));
vi.mock("@/lib/supabase/gallery", () => ({ getCurrentGallery: async () => h.gallery }));
vi.mock("@/lib/vercel/domains", () => ({
  addDomainToProject: h.addDomainToProject,
  removeDomainFromProject: h.removeDomainFromProject,
  getDomainStatus: h.getDomainStatus,
  dnsInstructionsFor: (d: string) => [{ type: "CNAME", name: d, value: "cname.example" }],
}));

import { connectCustomDomain, refreshDomainStatus, disconnectCustomDomain } from "./domain-actions";

const dbError = { message: "boom", code: "XX000" };

function form(domain: string) {
  const fd = new FormData();
  fd.set("domain", domain);
  return fd;
}

beforeEach(() => {
  h.fake = createFakeSupabase();
  h.revalidatePath.mockClear();
  h.addDomainToProject.mockReset();
  h.removeDomainFromProject.mockReset();
  h.getDomainStatus.mockReset();
  h.gallery = { id: "gal-1", custom_domain: null };
});

describe("connectCustomDomain", () => {
  it.each(["", "localhost", "-bad.com", "bad-.com", "has space.com", "a..com", "https://x.com", "x.com/path"])(
    "rejects %j before touching Vercel or the database",
    async (domain) => {
      await expect(connectCustomDomain(form(domain))).rejects.toThrow("doesn't look like a valid domain");
      expect(h.addDomainToProject).not.toHaveBeenCalled();
      expect(h.fake.queries).toHaveLength(0);
    },
  );

  it("normalises case and whitespace, registers with Vercel, saves as pending and returns DNS instructions", async () => {
    const result = await connectCustomDomain(form("  Art.Example.COM "));
    expect(h.addDomainToProject).toHaveBeenCalledWith("art.example.com");
    const q = h.fake.last("galleries", "update");
    expect(q?.payload).toEqual({ custom_domain: "art.example.com", domain_status: "pending" });
    expect(q?.filters).toEqual([["id", "gal-1"]]);
    expect(h.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(result).toEqual([{ type: "CNAME", name: "art.example.com", value: "cname.example" }]);
  });

  it("does not save when Vercel rejects the domain", async () => {
    h.addDomainToProject.mockRejectedValue(new Error("Domain taken"));
    await expect(connectCustomDomain(form("art.example.com"))).rejects.toThrow("Domain taken");
    expect(h.fake.queries).toHaveLength(0);
  });

  it("throws the database error without revalidating", async () => {
    h.fake.on("galleries", "update", { data: null, error: dbError });
    await expect(connectCustomDomain(form("art.example.com"))).rejects.toBe(dbError);
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("refreshDomainStatus", () => {
  it("does nothing when no domain is connected", async () => {
    await refreshDomainStatus();
    expect(h.getDomainStatus).not.toHaveBeenCalled();
    expect(h.fake.queries).toHaveLength(0);
  });

  it.each([
    [{ verified: true, misconfigured: false }, "verified"],
    [{ verified: true, misconfigured: true }, "pending"],
    [{ verified: false, misconfigured: false }, "pending"],
  ])("maps %j to %s", async (status, expected) => {
    h.gallery.custom_domain = "art.example.com";
    h.getDomainStatus.mockResolvedValue({ ...status, challenges: [] });
    await refreshDomainStatus();
    expect(h.getDomainStatus).toHaveBeenCalledWith("art.example.com");
    expect(h.fake.last("galleries", "update")?.payload).toEqual({ domain_status: expected });
    expect(h.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("throws the database error", async () => {
    h.gallery.custom_domain = "art.example.com";
    h.getDomainStatus.mockResolvedValue({ verified: true, misconfigured: false, challenges: [] });
    h.fake.on("galleries", "update", { data: null, error: dbError });
    await expect(refreshDomainStatus()).rejects.toBe(dbError);
  });
});

describe("disconnectCustomDomain", () => {
  it("does nothing when no domain is connected", async () => {
    await disconnectCustomDomain();
    expect(h.removeDomainFromProject).not.toHaveBeenCalled();
    expect(h.fake.queries).toHaveLength(0);
  });

  it("removes the domain from Vercel then clears it on the gallery", async () => {
    h.gallery.custom_domain = "art.example.com";
    await disconnectCustomDomain();
    expect(h.removeDomainFromProject).toHaveBeenCalledWith("art.example.com");
    expect(h.fake.last("galleries", "update")?.payload).toEqual({ custom_domain: null, domain_status: "none" });
    expect(h.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("keeps the gallery's domain when Vercel removal fails", async () => {
    h.gallery.custom_domain = "art.example.com";
    h.removeDomainFromProject.mockRejectedValue(new Error("vercel down"));
    await expect(disconnectCustomDomain()).rejects.toThrow("vercel down");
    expect(h.fake.queries).toHaveLength(0);
  });
});
