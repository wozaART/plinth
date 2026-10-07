import type { GalleryRow } from "@/lib/supabase/gallery";

export interface GalleryNavTab {
  id: string;
  label: string;
  enabled: boolean;
}

export interface GalleryRuntimeConfig {
  identity: {
    slug: string;
    name: string;
    shortName: string;
    tagline: string;
    city: string;
    logoWordmark?: { primary: string; secondary?: string };
  };
  nav: {
    galleryTabs: GalleryNavTab[];
    studioTabs: GalleryNavTab[];
  };
  business: {
    commissionRate: number;
    deliveryAddress: string;
    dropOffPassPrefix: string;
    currencyCode: string;
  };
  copy: {
    submitCommissionNoteTemplate: string;
  };
}

export function buildGalleryRuntimeConfig(gallery: GalleryRow): GalleryRuntimeConfig {
  return {
    identity: {
      slug: gallery.slug,
      name: gallery.name,
      shortName: gallery.short_name ?? gallery.name,
      tagline: gallery.tagline ?? "",
      city: gallery.city ?? "",
      logoWordmark: gallery.logo_wordmark_primary
        ? { primary: gallery.logo_wordmark_primary, secondary: gallery.logo_wordmark_secondary ?? undefined }
        : undefined,
    },
    nav: {
      galleryTabs: (gallery.gallery_tabs as unknown as GalleryNavTab[]) ?? [],
      studioTabs: (gallery.studio_tabs as unknown as GalleryNavTab[]) ?? [],
    },
    business: {
      commissionRate: gallery.commission_rate,
      deliveryAddress: gallery.delivery_address ?? "",
      dropOffPassPrefix: gallery.drop_off_pass_prefix ?? "",
      currencyCode: gallery.currency_code,
    },
    copy: {
      submitCommissionNoteTemplate: gallery.submit_commission_note_template,
    },
  };
}

export function renderCommissionNote(template: string, ratePct: number): string {
  return template.replace("{rate}", String(ratePct));
}
