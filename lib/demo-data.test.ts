import { describe, expect, it } from "vitest";
import * as demo from "./demo-data";
import { CAT_STATUS_META, EX_STATUS_META, EX_TYPE_META, FRAME_STAGE_META, PAYOUT_STATUS_META, STATUS_META } from "./constants";

// The demo portals render this static data through the same components as real
// data, so it has to stay consistent with the types and display tables.

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe("demo data", () => {
  it("has unique ids within each collection", () => {
    for (const [name, list] of Object.entries({
      submissions: demo.demoSubmissions,
      exhibitions: demo.demoExhibitions,
      catalogue: demo.demoCatalogue,
      contacts: demo.demoContacts,
      payouts: demo.demoPayouts,
      auditLog: demo.demoAuditLog,
      works: demo.demoWorks,
      openCalls: demo.demoOpenCalls,
      messages: demo.demoMessages,
      artists: demo.demoCatalogueArtists,
    })) {
      expect(unique(list.map((x) => x.id)), name).toBe(true);
    }
  });

  it("uses statuses and types the UI knows how to display", () => {
    for (const s of demo.demoSubmissions) expect(STATUS_META, s.id).toHaveProperty(s.status);
    for (const w of demo.demoWorks) expect(STATUS_META, w.id).toHaveProperty(w.status);
    for (const e of demo.demoExhibitions) {
      expect(EX_STATUS_META, e.id).toHaveProperty(e.status);
      expect(EX_TYPE_META, e.id).toHaveProperty(e.type);
    }
    for (const c of demo.demoCatalogue) expect(CAT_STATUS_META, c.id).toHaveProperty(c.status);
    for (const p of demo.demoPayouts) expect(PAYOUT_STATUS_META, p.id).toHaveProperty(p.status);
    for (const f of demo.demoFrameJobs) expect(FRAME_STAGE_META, f.title).toHaveProperty(f.stage);
  });

  it("links catalogue works to artists that exist, with matching names", () => {
    const artists = new Map(demo.demoCatalogueArtists.map((a) => [a.id, a.name]));
    for (const c of demo.demoCatalogue) expect(artists.get(c.artistId), c.id).toBe(c.artist);
    for (const p of demo.demoPayouts) expect(artists.get(p.artistId), p.id).toBe(p.artist);
  });

  it("keeps exhibition counts and prices coherent", () => {
    for (const e of demo.demoExhibitions) expect(e.filled, e.id).toBeLessThanOrEqual(e.slots);
    for (const c of demo.demoCatalogue) {
      expect(c.priceRaw, c.id).toBeGreaterThan(0);
      expect(c.commissionRatePct, c.id).toBeGreaterThanOrEqual(0);
      expect(c.commissionRatePct, c.id).toBeLessThanOrEqual(100);
    }
    for (const p of demo.demoPayouts) expect(p.amountCents, p.id).toBe(Number(p.amount.replace(/\D/g, "")) * 100);
  });

  it("only uses reserved example domains for emails", () => {
    for (const c of demo.demoContacts) expect(c.email).toMatch(/@example\.com$/);
    for (const a of demo.demoAuditLog) expect(a.actorEmail).toMatch(/@example\.com$/);
    expect(demo.demoArtistProfile.email).toMatch(/@example\.com$/);
  });

  it("includes a declined submission with a note, so the acknowledgement flow can be demoed", () => {
    const declined = demo.demoSubmissions.find((s) => s.status === "declined");
    expect(declined?.note).toBeTruthy();
  });
});
