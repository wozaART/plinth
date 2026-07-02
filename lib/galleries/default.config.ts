import type { GalleryConfig } from "../gallery-config.types";

function formatZar(amount: number): string {
  return `R ${Math.round(amount).toLocaleString("en-ZA")}`;
}

export const defaultConfig: GalleryConfig = {
  identity: {
    slug: "default",
    name: "The Sable Gallery",
    shortName: "Sable",
    tagline: "The quiet operating system for small contemporary galleries.",
    city: "Maboneng, Johannesburg",
    logoWordmark: { primary: "Plinth" },
  },
  theme: {
    mode: "light",
    colors: {
      accent: "#B5623C",
      accentHover: "#9C4F30",
      onAccent: "#FBFAF8",

      solid: "#17150F",
      onSolid: "#FBFAF8",

      bgApp: "#FBFAF8",
      bgShell: "#EFECE4",
      sidebar: "#F4F1EA",
      surface: "#FFFFFF",
      surfaceDark: "#1C1A17",

      text: "#17150F",
      textBody: "#2A2723",
      textSecondary: "#57534A",
      textMuted: "#6B655B",
      textSoft: "#8B8579",
      textFaint: "#9A9486",
      textEyebrow: "#A39D8E",
      onDark: "#FBFAF8",
      onDarkSoft: "#B8B2A6",
      onDarkFaint: "#8A8478",

      border: "#ECE8DE",
      borderStrong: "#E7E3D9",
      borderInput: "#E0DBCF",
      borderChip: "#E4DFD3",
      divider: "#F1EEE6",
      borderDark: "#3D382F",

      status: {
        pending: { bg: "#F4ECD9", fg: "#8A6A1E", dot: "#C2922F" },
        approved: { bg: "#E7EFE1", fg: "#4A6138", dot: "#6B8A4E", panelBg: "#EEF2EA", panelBorder: "#DBE6D2" },
        declined: { bg: "#F3E4E0", fg: "#8A3A30", dot: "#B04A3C", panelBg: "#F8EAE6", panelBorder: "#EAD2CB" },
        changes: { bg: "#E6EBEF", fg: "#3C566B", dot: "#5A7894", panelBg: "#EAEEF2", panelBorder: "#D5DEE6" },
      },
      neutralChipBg: "#EEEAE0",
      neutralChipFg: "#57534A",
    },
    fonts: {
      display: { googleFont: "Newsreader", weights: ["400", "500", "600"], styles: ["normal", "italic"] },
      body: { googleFont: "Geist" },
      mono: { googleFont: "Geist_Mono" },
    },
  },
  nav: {
    galleryTabs: [
      { id: "submissions", label: "Submissions", enabled: true },
      { id: "exhibitions", label: "Exhibitions", enabled: true },
      { id: "catalogue", label: "Catalogue", enabled: true },
      { id: "contacts", label: "Contacts", enabled: true },
      { id: "frameshop", label: "Frameshop", enabled: false },
    ],
    studioTabs: [
      { id: "overview", label: "Overview", enabled: true },
      { id: "submissions", label: "My submissions", enabled: true },
      { id: "open-calls", label: "Open calls", enabled: true },
      { id: "messages", label: "Messages", enabled: true },
      { id: "profile", label: "Profile", enabled: false },
    ],
  },
  business: {
    currencyFormat: formatZar,
    commissionRate: 0.4,
    deliveryAddress: "Studio 4, Arts on Main, Maboneng, Johannesburg",
    dropOffPassPrefix: "PL-S",
  },
  copy: {
    submitCommissionNote: (ratePct) =>
      `The gallery commission of ${ratePct}% will be added on top of your asking price for the final sale price shown to collectors.`,
  },
};
