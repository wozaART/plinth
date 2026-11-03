import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));
vi.mock("@/lib/supabase/gallery", () => ({ getCurrentGallery: async () => ({ id: "gal-1" }) }));

import { updateGalleryMail } from "./mail-actions";

function form(localPart: string, replyTo = "") {
  const fd = new FormData();
  fd.set("localPart", localPart);
  fd.set("replyTo", replyTo);
  return fd;
}

beforeEach(() => {
  h.fake = createFakeSupabase();
  h.revalidatePath.mockClear();
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

  it("reports a taken address in plain words", async () => {
    h.fake.on("galleries", "update", { error: { code: "23505", message: "dup" } });
    await expect(updateGalleryMail(form("taken"))).rejects.toThrow("already taken");
  });
});
