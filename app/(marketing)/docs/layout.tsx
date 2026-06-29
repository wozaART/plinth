import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Plinth",
  description: "Guides, tutorials and articles for setting up and running your gallery on Plinth.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
