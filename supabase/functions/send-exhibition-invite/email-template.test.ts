import { describe, expect, it } from "vitest";
import { renderExhibitionInviteEmail } from "./email-template.ts";

const base = {
  galleryName: "Gallery One",
  accentColor: "#c2410c",
  artistName: "Thandi",
  inviterName: "Sam",
  exhibitionTitle: "Spring Show", message: "See you there",
  inviteUrl: "https://app.test/invite/abc",
  expiryDate: "1 June 2026",
  appUrl: "https://app.test",
};

describe("renderExhibitionInviteEmail", () => {
  it("includes the gallery, artist, inviter, link and expiry", () => {
    const html = renderExhibitionInviteEmail(base);
    expect(html).toContain("Gallery One");
    expect(html).toContain("Hi Thandi,");
    expect(html).toContain("Sam");
    expect(html).toContain('href="https://app.test/invite/abc"');
    expect(html).toContain("1 June 2026");
    expect(html).toContain(">app.test</a>");
  });

  it("greets a nameless artist with 'there'", () => {
    expect(renderExhibitionInviteEmail({ ...base, artistName: "" })).toContain("Hi there,");
  });

  it("escapes HTML in user-supplied fields", () => {
    const html = renderExhibitionInviteEmail({ ...base, galleryName: "<script>x</script>", inviterName: "<b>S</b>", inviteUrl: 'https://a.test/"x' });
    expect(html).not.toContain("<script>x</script>");
    expect(html).not.toContain("<b>S</b>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).toContain("https://a.test/&quot;x");
  });

  it("shows the exhibition title and the personal message", () => {
    const html = renderExhibitionInviteEmail(base);
    expect(html).toContain("Spring Show");
    expect(html).toContain("See you there");
  });

  it("omits the message block when there is no message", () => {
    expect(renderExhibitionInviteEmail({ ...base, message: "" })).not.toContain("font-style:italic");
  });

  it("escapes the message and exhibition title", () => {
    const html = renderExhibitionInviteEmail({ ...base, message: "<i>hi</i>", exhibitionTitle: "<em>E</em>" });
    expect(html).not.toContain("<i>hi</i>");
    expect(html).not.toContain("<em>E</em>");
  });
});
