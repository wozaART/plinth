import { afterEach, describe, expect, it, vi } from "vitest";
import { escapeHtml, resolveSender, sendEmail } from "./resend.ts";

afterEach(() => vi.unstubAllGlobals());

function stubDeno(env: Record<string, string>) {
  vi.stubGlobal("Deno", { env: { get: (key: string) => env[key] } });
}

describe("escapeHtml", () => {
  it("escapes the characters that matter in text and attributes", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;");
  });

  it("escapes ampersands first so entities aren't double-decoded", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves plain text alone", () => {
    expect(escapeHtml("Plain text 123")).toBe("Plain text 123");
  });
});

describe("resolveSender", () => {
  it("builds a quoted From on the mail domain with the reply-to", () => {
    expect(
      resolveSender({ name: "Gallery X", mail_local_part: "galleryx", reply_to_email: "hi@x.com" }, "mail.woza.art"),
    ).toEqual({ from: `"Gallery X" <galleryx@mail.woza.art>`, replyTo: "hi@x.com" });
  });

  it("falls back to the platform sender without a local part or domain", () => {
    stubDeno({});
    expect(resolveSender({ name: "G", mail_local_part: null }, "mail.woza.art")).toBeUndefined();
    expect(resolveSender({ name: "G", mail_local_part: "g" }, undefined)).toBeUndefined();
  });

  it("strips characters that could break the display name", () => {
    const sender = resolveSender({ name: `Bad", <evil@x.com>`, mail_local_part: "g" }, "mail.woza.art");
    expect(sender?.from).toBe(`"Bad evil@x.com" <g@mail.woza.art>`);
  });
});

describe("sendEmail", () => {
  it("uses the gallery sender and reply_to when given", async () => {
    stubDeno({ RESEND_API_KEY: "key" });
    const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail("a@test.dev", "S", "H", { from: "G <g@mail.woza.art>", replyTo: "hi@g.com" });

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe("G <g@mail.woza.art>");
    expect(body.reply_to).toBe("hi@g.com");
  });

  it("posts to Resend with the key, sender, recipient and body", async () => {
    stubDeno({ RESEND_API_KEY: "key", RESEND_FROM_EMAIL: "Gallery <hi@gallery.test>" });
    const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail("artist@test.dev", "Subject", "<p>Hi</p>");

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Gallery <hi@gallery.test>",
      to: ["artist@test.dev"],
      subject: "Subject",
      html: "<p>Hi</p>",
    });
  });

  it("falls back to the Resend sandbox sender when none is configured", async () => {
    stubDeno({ RESEND_API_KEY: "key" });
    const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail("a@test.dev", "S", "H");

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string).from).toBe("Woza Art <onboarding@resend.dev>");
  });

  it("surfaces Resend's error body on failure", async () => {
    stubDeno({ RESEND_API_KEY: "key" });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("domain not verified", { status: 403 }))));

    expect(await sendEmail("a@test.dev", "S", "H")).toEqual({ ok: false, error: "Resend error: domain not verified" });
  });
});
