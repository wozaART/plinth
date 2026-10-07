import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Woza Art",
  description: "Guides, tutorials and articles for setting up and running your gallery on Woza Art.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
