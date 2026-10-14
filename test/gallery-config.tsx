import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { GalleryConfigProvider } from "@/lib/gallery-context";
import type { GalleryRuntimeConfig } from "@/lib/gallery-runtime-config";

export const galleryConfig: GalleryRuntimeConfig = {
  identity: { slug: "woza", name: "Woza Art", shortName: "Woza", tagline: "", city: "Cape Town" },
  nav: { galleryTabs: [], studioTabs: [] },
  business: { commissionRate: 0.4, deliveryAddress: "", dropOffPassPrefix: "WZ", currencyCode: "ZAR" },
  copy: { submitCommissionNoteTemplate: "Gallery keeps {rate}%" },
};

export function renderWithGallery(ui: ReactElement, config: GalleryRuntimeConfig = galleryConfig) {
  return render(<GalleryConfigProvider value={config}>{ui}</GalleryConfigProvider>);
}
