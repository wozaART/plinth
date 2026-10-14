import { describe, expect, it } from "vitest";
import { renderArtistInviteEmail } from "./email-template.ts";

const base = {
  galleryName: "Gallery One",
  accentColor: "#c2410c",
  artistName: "Thandi",
  inviterName: "Sam",
  
  inviteUrl: "https://app.test/invite/abc",
  expiryDate: "1 June 2026",
  appUrl: "https://app.test",
};

describe("renderArtistInviteEmail", () => {
  it("includes the gallery, artist, inviter, link and expiry", () => {
    const html = renderArtistInviteEmail(base);
    expect(html).toContain("Gallery One");
    expect(html).toContain("Hi Thandi,");
    expect(html).toContain("Sam");
    expect(html).toContain('href="https://app.test/invite/abc"');
    expect(html).toContain("1 June 2026");
    expect(html).toContain(">app.test</a>");
  });

  it("greets a nameless artist with 'there'", () => {
    expect(renderArtistInviteEmail({ ...base, artistName: "" })).toContain("Hi there,");
  });

  it("escapes HTML in user-supplied fields", () => {
    const html = renderArtistInviteEmail({ ...base, galleryName: "<script>x</script>", inviterName: "<b>S</b>", inviteUrl: 'https://a.test/"x' });
    expect(html).not.toContain("<script>x</script>");
    expect(html).not.toContain("<b>S</b>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).toContain("https://a.test/&quot;x");
  });
});
