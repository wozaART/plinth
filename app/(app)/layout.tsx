import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { Cinzel, Poppins } from "next/font/google";
import { createClient } from "@/utils/supabase/server";
import { getCurrentGallery } from "@/lib/supabase/gallery";
import { GalleryConfigProvider } from "@/lib/gallery-context";
import { buildGalleryRuntimeConfig } from "@/lib/gallery-runtime-config";
import { themeCssVars } from "@/lib/theme-css";
import { isDemoUser } from "@/lib/demo";
import { DEMO_BRAND_COOKIE, demoBrandCssVars, demoBrandFontHref, parseDemoBrand } from "@/lib/demo-brand";

// Gallery-specific display/body fonts, scoped to the portal route group only —
// the marketing site and auth pages always use the fixed default fonts loaded
// in the root layout. Like the root layout, next/font/google needs a literal,
// statically-imported call per font, so both are declared here regardless of
// whether the active gallery actually selects them. A gallery wanting an
// unlisted font still needs this file updated — self-serve theming only
// covers colors/fonts within this declared set.
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "600", "700"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(await cookies());
  const gallery = await getCurrentGallery(supabase);
  return { title: `${gallery.name} — Gallery Management` };
}

export async function generateViewport(): Promise<Viewport> {
  const supabase = createClient(await cookies());
  const gallery = await getCurrentGallery(supabase);
  const colors = gallery.theme_colors as unknown as { bgApp: string };
  return { themeColor: colors.bgApp };
}

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const gallery = await getCurrentGallery(supabase);
  const runtimeConfig = buildGalleryRuntimeConfig(gallery);

  // Demo visitors who styled the portals on /review see their own brand.
  const { data: { user } } = await supabase.auth.getUser();
  const brand = isDemoUser(user) ? parseDemoBrand(cookieStore.get(DEMO_BRAND_COOKIE)?.value) : null;
  if (brand?.name) {
    runtimeConfig.identity.name = brand.name;
    runtimeConfig.identity.shortName = brand.name;
    runtimeConfig.identity.logoWordmark = undefined;
  }
  const fontHref = brand ? demoBrandFontHref(brand) : null;

  const fontDisplay = gallery.font_display as unknown as { googleFont: string };
  const fontBody = gallery.font_body as unknown as { googleFont: string };
  const fontOverrides: Record<string, string> = {};
  if (fontDisplay.googleFont === "Cinzel") fontOverrides["--font-newsreader"] = "var(--font-cinzel)";
  if (fontBody.googleFont === "Poppins") fontOverrides["--font-geist-sans"] = "var(--font-poppins)";

  return (
    <div
      className={`${cinzel.variable} ${poppins.variable} h-full`}
      style={{ ...themeCssVars(gallery), ...fontOverrides, ...(brand ? demoBrandCssVars(brand) : {}) } as CSSProperties}
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <GalleryConfigProvider value={runtimeConfig}>{children}</GalleryConfigProvider>
    </div>
  );
}
