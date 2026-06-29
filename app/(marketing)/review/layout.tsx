import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalise & review — Plinth",
  description: "See Plinth in your own gallery's brand, then share your feedback to help shape what we build next.",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
