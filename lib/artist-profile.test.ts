import { describe, expect, it } from "vitest";
import { isLinkKind, linkKindLabel, normaliseLinkUrl, profileImagePathFromUrl } from "./artist-profile";

describe("normaliseLinkUrl", () => {
  it("adds https to bare addresses and keeps existing schemes", () => {
    expect(normaliseLinkUrl("instagram.com/ana")).toBe("https://instagram.com/ana");
    expect(normaliseLinkUrl("  http://ana.art ")).toBe("http://ana.art/");
    expect(normaliseLinkUrl("https://ana.art/work?x=1")).toBe("https://ana.art/work?x=1");
  });

  it.each(["", "   ", "javascript:alert(1)", "data:text/html,hi", "ftp://ana.art", "localhost", "two words.com", `https://a.com/${"x".repeat(500)}`])(
    "rejects %j",
    (raw) => expect(normaliseLinkUrl(raw)).toBeNull(),
  );
});

describe("link kinds", () => {
  it("recognises known kinds and labels them", () => {
    expect(isLinkKind("instagram")).toBe(true);
    expect(isLinkKind("myspace")).toBe(false);
    expect(linkKindLabel("x")).toBe("X");
    expect(linkKindLabel("unknown")).toBe("Link");
  });
});

describe("profileImagePathFromUrl", () => {
  it("extracts the object path from a public bucket URL", () => {
    expect(profileImagePathFromUrl("https://p.supabase.co/storage/v1/object/public/artist-profile-images/u1/w1/1.jpg?t=2")).toBe("u1/w1/1.jpg");
  });
  it("returns null for URLs from another bucket", () => {
    expect(profileImagePathFromUrl("https://p.supabase.co/storage/v1/object/public/submission-images/u1/1.jpg")).toBeNull();
  });
});
