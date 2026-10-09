import { cookies } from "next/headers";
import type { CSSProperties } from "react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { GalleryConfigProvider } from "@/lib/gallery-context";
import { buildGalleryRuntimeConfig } from "@/lib/gallery-runtime-config";
import { DEMO_BRAND_COOKIE, demoBrandCssVars, demoBrandFontHref, parseDemoBrand } from "@/lib/demo-brand";
import DemoBackLink from "@/components/demo/DemoBackLink";

// Wraps the public demo portals: applies the branding chosen on /review (if
// any) on top of the default gallery theme, and adds the way back.
export default async function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const gallery = await getCurrentGallery(createClient(cookieStore));
  const runtimeConfig = buildGalleryRuntimeConfig(gallery);

  const brand = parseDemoBrand(cookieStore.get(DEMO_BRAND_COOKIE)?.value);
  if (brand?.name) {
    runtimeConfig.identity.name = brand.name;
    runtimeConfig.identity.shortName = brand.name;
    runtimeConfig.identity.logoWordmark = undefined;
  }
  const fontHref = brand ? demoBrandFontHref(brand) : null;

  return (
    <div className="h-full" style={brand ? (demoBrandCssVars(brand) as CSSProperties) : undefined}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <GalleryConfigProvider value={runtimeConfig}>{children}</GalleryConfigProvider>
      <DemoBackLink />
    </div>
  );
}
