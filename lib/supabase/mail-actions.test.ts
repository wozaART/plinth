import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  revalidatePath: vi.fn(),
  gallery: {} as Record<string, unknown>,
  createMailDomain: vi.fn(),
  refreshMailDomain: vi.fn(),
  deleteMailDomain: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));
vi.mock("@/lib/supabase/gallery", () => ({ getCurrentGallery: async () => h.gallery }));
vi.mock("@/lib/resend/domains", () => ({
  createMailDomain: h.createMailDomain,
  refreshMailDomain: h.refreshMailDomain,
  deleteMailDomain: h.deleteMailDomain,
}));

import { refreshMailDomainStatus, removeMailDomain, setUpMailDomain, updateGalleryMail } from "./mail-actions";

function form(localPart: string, replyTo = "") {
  const fd = new FormData();
  fd.set("localPart", localPart);
  fd.set("replyTo", replyTo);
  return fd;
}

beforeEach(() => {
  h.fake = createFakeSupabase();
  h.revalidatePath.mockClear();
  h.createMailDomain.mockReset();
  h.refreshMailDomain.mockReset();
  h.deleteMailDomain.mockReset();
  h.gallery = { id: "gal-1", custom_domain: "gallery.example.com", resend_domain_id: null };
});

describe("updateGalleryMail", () => {
  it.each([
    [form("Bad Name"), "lowercase letters"],
    [form("-leading"), "lowercase letters"],
    [form("a".repeat(33)), "lowercase letters"],
    [form("postmaster"), "reserved"],
    [form("gallery", "not-an-email"), "valid email"],
  ])("rejects invalid input before touching the database", async (fd, message) => {
    await expect(updateGalleryMail(fd)).rejects.toThrow(message);
    expect(h.fake.queries).toHaveLength(0);
  });

  it("saves the local part and reply-to for the current gallery", async () => {
    await updateGalleryMail(form("Gallery-X", "hello@galleryx.com"));
    const q = h.fake.last("galleries", "update");
    expect(q?.payload).toEqual({ mail_local_part: "gallery-x", reply_to_email: "hello@galleryx.com" });
    expect(q?.filters).toEqual([["id", "gal-1"]]);
    expect(h.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("clears both settings when the fields are empty", async () => {
    await updateGalleryMail(form(""));
    expect(h.fake.last("galleries", "update")?.payload).toEqual({ mail_local_part: null, reply_to_email: null });
  });
});

describe("mail domain", () => {
  const records = [{ type: "TXT", name: "resend._domainkey", value: "p=abc" }];

  it("registers the custom domain with Resend and stores the id", async () => {
    h.createMailDomain.mockResolvedValue({ id: "dom-1", status: "pending", records });

    expect(await setUpMailDomain()).toEqual(records);

    expect(h.createMailDomain).toHaveBeenCalledWith("gallery.example.com");
    const q = h.fake.last("galleries", "update");
    expect(q?.payload).toEqual({ resend_domain_id: "dom-1", mail_domain_status: "pending" });
    expect(q?.filters).toEqual([["id", "gal-1"]]);
  });

  it("needs a custom domain and refuses to register twice", async () => {
    h.gallery = { id: "gal-1", custom_domain: null, resend_domain_id: null };
    await expect(setUpMailDomain()).rejects.toThrow("Connect a custom domain");
    h.gallery = { id: "gal-1", custom_domain: "g.example.com", resend_domain_id: "dom-1" };
    await expect(setUpMailDomain()).rejects.toThrow("already set up");
    expect(h.createMailDomain).not.toHaveBeenCalled();
  });

  it("saves the verification status Resend reports", async () => {
    h.gallery = { id: "gal-1", custom_domain: "g.example.com", resend_domain_id: "dom-1" };
    h.refreshMailDomain.mockResolvedValue({ id: "dom-1", status: "verified", records });

    expect(await refreshMailDomainStatus()).toEqual({ status: "verified", records });
    expect(h.fake.last("galleries", "update")?.payload).toEqual({ mail_domain_status: "verified" });
  });

  it("deletes the Resend domain and resets the gallery", async () => {
    h.gallery = { id: "gal-1", custom_domain: "g.example.com", resend_domain_id: "dom-1" };
    await removeMailDomain();
    expect(h.deleteMailDomain).toHaveBeenCalledWith("dom-1");
    expect(h.fake.last("galleries", "update")?.payload).toEqual({ resend_domain_id: null, mail_domain_status: "none" });
  });
});
