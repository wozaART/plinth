import { describe, expect, it } from "vitest";
import { buildGalleryRuntimeConfig, renderCommissionNote } from "./gallery-runtime-config";
import type { GalleryRow } from "@/lib/supabase/gallery";

const tabs = [{ id: "dashboard", label: "Dashboard", enabled: true }];

function gallery(overrides: Partial<GalleryRow> = {}): GalleryRow {
  return {
    slug: "woza",
    name: "Woza Art",
    short_name: "Woza",
    tagline: "Art, together",
    city: "Cape Town",
    logo_wordmark_primary: "WOZA",
    logo_wordmark_secondary: "art",
    gallery_tabs: tabs,
    studio_tabs: tabs,
    commission_rate: 40,
    delivery_address: "1 Long St",
    drop_off_pass_prefix: "WZ",
    currency_code: "ZAR",
    submit_commission_note_template: "Gallery keeps {rate}%",
    ...overrides,
  } as GalleryRow;
}

describe("buildGalleryRuntimeConfig", () => {
  it("maps a fully-populated row", () => {
    const cfg = buildGalleryRuntimeConfig(gallery());
    expect(cfg.identity).toEqual({
      slug: "woza",
      name: "Woza Art",
      shortName: "Woza",
      tagline: "Art, together",
      city: "Cape Town",
      logoWordmark: { primary: "WOZA", secondary: "art" },
    });
    expect(cfg.nav.galleryTabs).toEqual(tabs);
    expect(cfg.business).toEqual({
      commissionRate: 40,
      deliveryAddress: "1 Long St",
      dropOffPassPrefix: "WZ",
      currencyCode: "ZAR",
    });
    expect(cfg.copy.submitCommissionNoteTemplate).toBe("Gallery keeps {rate}%");
  });

  it("falls back for nullable fields", () => {
    const cfg = buildGalleryRuntimeConfig(
      gallery({
        short_name: null,
        tagline: null,
        city: null,
        logo_wordmark_primary: null,
        logo_wordmark_secondary: null,
        delivery_address: null,
        drop_off_pass_prefix: null,
      }),
    );
    expect(cfg.identity.shortName).toBe("Woza Art");
    expect(cfg.identity.tagline).toBe("");
    expect(cfg.identity.city).toBe("");
    expect(cfg.identity.logoWordmark).toBeUndefined();
    expect(cfg.business.deliveryAddress).toBe("");
    expect(cfg.business.dropOffPassPrefix).toBe("");
  });

  it("omits the wordmark secondary when absent", () => {
    const cfg = buildGalleryRuntimeConfig(gallery({ logo_wordmark_secondary: null }));
    expect(cfg.identity.logoWordmark).toEqual({ primary: "WOZA", secondary: undefined });
  });
});

describe("renderCommissionNote", () => {
  it("substitutes the rate", () => {
    expect(renderCommissionNote("Gallery keeps {rate}%", 35)).toBe("Gallery keeps 35%");
  });

  it("leaves templates without a placeholder untouched", () => {
    expect(renderCommissionNote("No placeholder", 35)).toBe("No placeholder");
  });
});
