import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";
import { validFormData } from "@/test/form-data";
import { TERMS_QUESTIONS } from "@/lib/consignment-terms";

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  revalidatePath: vi.fn(),
  headerValues: {} as Record<string, string>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({}),
  headers: async () => ({ get: (k: string) => h.headerValues[k] ?? null }),
}));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));

import * as actions from "./consignment-terms-actions";

const dbError = { message: "boom", code: "XX000" };

beforeEach(() => {
  h.fake = createFakeSupabase();
  h.revalidatePath.mockClear();
  h.headerValues = {};
  delete process.env.NEXT_PUBLIC_APP_URL;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const contact = {
  gallery_name: "Gallery A",
  contact_name: "Pat",
  contact_role: "Owner",
  contact_email: "pat@a.co",
};

describe("submitConsignmentTerms", () => {
  beforeEach(() => h.fake.on("consignment_terms_responses", "insert", { data: { id: "r1" }, error: null }));

  it("silently succeeds without writing when the honeypot is filled", async () => {
    const fd = validFormData(TERMS_QUESTIONS, contact);
    fd.set("website", "http://spam.example");
    expect(await actions.submitConsignmentTerms(fd)).toEqual({ ok: true });
    expect(h.fake.queries).toHaveLength(0);
    expect(h.fake.invocations).toHaveLength(0);
  });

  it("returns per-field errors and writes nothing when validation fails", async () => {
    const fd = validFormData(TERMS_QUESTIONS, { ...contact, gallery_name: "", contact_email: "not-an-email" });
    const result = await actions.submitConsignmentTerms(fd);
    expect(result).toMatchObject({ ok: false, message: "A few answers need another look." });
    if (!result.ok) {
      expect(result.errors.gallery_name).toBeTruthy();
      expect(result.errors.contact_email).toBe("Enter a valid email address.");
    }
    expect(h.fake.queries).toHaveLength(0);
  });

  it("inserts the contact columns separately from the answers and notifies the platform owner", async () => {
    const result = await actions.submitConsignmentTerms(validFormData(TERMS_QUESTIONS, contact));
    expect(result).toEqual({ ok: true });

    const insert = h.fake.last("consignment_terms_responses", "insert");
    const payload = insert?.payload as Record<string, unknown> & { answers: Record<string, string> };
    expect(payload).toMatchObject(contact);
    expect(payload.id).toEqual(expect.any(String));
    expect(payload.answers).not.toHaveProperty("gallery_name");
    expect(payload.answers).not.toHaveProperty("contact_email");
    expect(Object.keys(payload.answers).length).toBeGreaterThan(0);

    expect(h.fake.invocations).toEqual([
      {
        fn: "notify-consignment-terms-response",
        body: expect.objectContaining({ responseId: payload.id, galleryName: "Gallery A", contactEmail: "pat@a.co" }),
      },
    ]);
  });

  it("stores a blank role as null", async () => {
    await actions.submitConsignmentTerms(validFormData(TERMS_QUESTIONS, { ...contact, contact_role: "" }));
    const payload = h.fake.last("consignment_terms_responses", "insert")?.payload as { contact_role: unknown };
    expect(payload.contact_role).toBeNull();
  });

  it("reports a save failure without notifying", async () => {
    h.fake.on("consignment_terms_responses", "insert", { data: null, error: dbError });
    const result = await actions.submitConsignmentTerms(validFormData(TERMS_QUESTIONS, contact));
    expect(result).toEqual({ ok: false, message: "We couldn't save your answers. Please try again.", errors: {} });
    expect(h.fake.invocations).toHaveLength(0);
  });

  it("still reports success when the notification email fails", async () => {
    const original = h.fake.client.functions.invoke;
    h.fake.client.functions.invoke = (fn, opts) => {
      original(fn, opts);
      return Promise.reject(new Error("resend down")) as never;
    };
    expect(await actions.submitConsignmentTerms(validFormData(TERMS_QUESTIONS, contact))).toEqual({ ok: true });
  });
});

describe("markConsignmentResponseReviewed", () => {
  it("marks the response reviewed and revalidates the admin page", async () => {
    await actions.markConsignmentResponseReviewed("r1");
    const q = h.fake.last("consignment_terms_responses", "update");
    expect(q?.payload).toEqual({ status: "reviewed" });
    expect(q?.filters).toEqual([["id", "r1"]]);
    expect(h.revalidatePath).toHaveBeenCalledWith("/admin/consignment-terms");
  });

  it("throws on a database error without revalidating", async () => {
    h.fake.on("consignment_terms_responses", "update", { data: null, error: dbError });
    await expect(actions.markConsignmentResponseReviewed("r1")).rejects.toBe(dbError);
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("sendConsignmentTermsFollowup", () => {
  it("invokes the edge function and revalidates", async () => {
    h.fake.state.invokeResult = { data: { sent: true }, error: null };
    expect(await actions.sendConsignmentTermsFollowup("r1", "Hello")).toEqual({ sent: true });
    expect(h.fake.invocations).toEqual([
      { fn: "send-consignment-terms-followup", body: { responseId: "r1", message: "Hello" } },
    ]);
    expect(h.revalidatePath).toHaveBeenCalledWith("/admin/consignment-terms");
  });

  it("surfaces the edge function's error body (e.g. a non-owner being rejected)", async () => {
    h.fake.state.invokeResult = {
      data: null,
      error: { message: "non-2xx", context: { json: async () => ({ error: "Not allowed." }) } },
    };
    await expect(actions.sendConsignmentTermsFollowup("r1", "Hi")).rejects.toThrow("Not allowed.");
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });

  it("falls back to the transport message when the body is unreadable", async () => {
    h.fake.state.invokeResult = {
      data: null,
      error: { message: "non-2xx", context: { json: async () => Promise.reject(new Error("bad json")) } },
    };
    await expect(actions.sendConsignmentTermsFollowup("r1", "Hi")).rejects.toThrow("non-2xx");
  });

  it("throws an error returned in a successful response body", async () => {
    h.fake.state.invokeResult = { data: { error: "Message too long." }, error: null };
    await expect(actions.sendConsignmentTermsFollowup("r1", "Hi")).rejects.toThrow("Message too long.");
  });
});

describe("sendConsignmentTermsInvite", () => {
  const input = { contactName: "Pat", contactEmail: "pat@a.co" };

  it("rejects anonymous callers before invoking anything", async () => {
    await expect(actions.sendConsignmentTermsInvite(input)).rejects.toThrow("Not signed in.");
    expect(h.fake.invocations).toHaveLength(0);
  });

  it("sends the invite with the configured app URL", async () => {
    h.fake.state.user = { id: "u1" };
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
    h.fake.state.invokeResult = { data: { sent: true }, error: null };
    expect(await actions.sendConsignmentTermsInvite(input)).toEqual({ sent: true });
    expect(h.fake.invocations[0]).toEqual({
      fn: "send-consignment-terms-invite",
      body: { appUrl: "https://app.example", ...input },
    });
  });

  it("derives the app URL from the host header, using http only for localhost", async () => {
    h.fake.state.user = { id: "u1" };
    h.headerValues.host = "localhost:3000";
    await actions.sendConsignmentTermsInvite(input);
    h.headerValues.host = "woza.art";
    await actions.sendConsignmentTermsInvite(input);
    expect(h.fake.invocations.map((i) => (i.body as { appUrl: string }).appUrl)).toEqual([
      "http://localhost:3000",
      "https://woza.art",
    ]);
  });

  it("surfaces edge function errors", async () => {
    h.fake.state.user = { id: "u1" };
    h.fake.state.invokeResult = { data: { error: "Invalid email." }, error: null };
    await expect(actions.sendConsignmentTermsInvite(input)).rejects.toThrow("Invalid email.");
  });
});
