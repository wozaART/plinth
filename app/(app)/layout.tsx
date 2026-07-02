import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Cinzel, Poppins } from "next/font/google";
import { galleryConfig } from "@/lib/gallery.config";
import { themeCssVars } from "@/lib/theme-css";

// Gallery-specific display/body fonts, scoped to the portal route group only —
// the marketing site and auth pages always use the fixed default fonts loaded
// in the root layout. Like the root layout, next/font/google needs a literal,
// statically-imported call per font, so both are declared here regardless of
// whether the active gallery config actually selects them.
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "600", "700"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${galleryConfig.identity.name} — Gallery Management`,
};

export const viewport: Viewport = {
  themeColor: galleryConfig.theme.colors.bgApp,
};

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { fonts } = galleryConfig.theme;
  const fontOverrides: Record<string, string> = {};
  if (fonts.display.googleFont === "Cinzel") fontOverrides["--font-newsreader"] = "var(--font-cinzel)";
  if (fonts.body.googleFont === "Poppins") fontOverrides["--font-geist-sans"] = "var(--font-poppins)";

  return (
    <div
      className={`${cinzel.variable} ${poppins.variable} h-full`}
      style={{ ...themeCssVars(galleryConfig), ...fontOverrides } as CSSProperties}
    >
      {children}
    </div>
  );
}
