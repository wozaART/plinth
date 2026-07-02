import type { GalleryConfig } from "../gallery-config.types";

function formatZar(amount: number): string {
  return `R ${Math.round(amount).toLocaleString("en-ZA")}`;
}

export const jvhConfig: GalleryConfig = {
  identity: {
    slug: "jvh",
    name: "JV Hart Gallery",
    shortName: "JVH",
    tagline: "Contemporary art from across South Africa, rotating monthly.",
    city: "Garsfontein, Pretoria",
    logoWordmark: { primary: "JVH", secondary: "ART GALLERY" },
  },
  theme: {
    mode: "dark",
    colors: {
      accent: "#22C39C",
      accentHover: "#159A79",
      onAccent: "#06251C",

      bgApp: "#0C0C0E",
      bgShell: "#141416",
      sidebar: "#0C0C0E",
      surface: "#1A1A1D",
      surfaceDark: "#0C0C0E",

      text: "#F3F2F0",
      textBody: "#F3F2F0",
      textSecondary: "#C6C4CA",
      textMuted: "#9A98A0",
      textSoft: "#9A98A0",
      textFaint: "#6E6C74",
      textEyebrow: "#9A98A0",
      onDark: "#F3F2F0",
      onDarkSoft: "#C4C2C8",
      onDarkFaint: "#8A8478",

      border: "#2C2C31",
      borderStrong: "#2C2C31",
      borderInput: "#2C2C31",
      borderChip: "#2C2C31",
      divider: "#2C2C31",
      borderDark: "#2C2C31",

      status: {
        pending: { bg: "rgba(224,181,74,.14)", fg: "#E6C15C", dot: "#E0B54A" },
        approved: { bg: "#2E7D52", fg: "#EAFBF1", dot: "#3FBE7C", panelBg: "rgba(34,195,156,.09)", panelBorder: "rgba(34,195,156,.3)" },
        declined: { bg: "rgba(224,96,80,.14)", fg: "#EDA093", dot: "#D66152", panelBg: "rgba(224,96,80,.09)", panelBorder: "rgba(224,96,80,.3)" },
        changes: { bg: "rgba(90,160,220,.14)", fg: "#8FC3E6", dot: "#5AA0DC", panelBg: "rgba(90,160,220,.09)", panelBorder: "rgba(90,160,220,.3)" },
      },
      neutralChipBg: "#232327",
      neutralChipFg: "#9A98A0",
    },
    fonts: {
      display: { googleFont: "Cinzel", weights: ["500", "600", "700"] },
      body: { googleFont: "Poppins", weights: ["300", "400", "500", "600", "700"] },
      mono: { googleFont: "Geist_Mono" },
    },
  },
  nav: {
    galleryTabs: [
      { id: "submissions", label: "Submissions", enabled: true },
      { id: "exhibitions", label: "Exhibitions", enabled: true },
      { id: "catalogue", label: "Catalogue", enabled: true },
      { id: "frameshop", label: "Frameshop", enabled: true },
      { id: "contacts", label: "Contacts", enabled: true },
    ],
    studioTabs: [
      { id: "overview", label: "Overview", enabled: true },
      { id: "submissions", label: "My submissions", enabled: true },
      { id: "open-calls", label: "Open calls", enabled: true },
      { id: "profile", label: "Profile", enabled: true },
      { id: "messages", label: "Messages", enabled: true },
    ],
  },
  business: {
    currencyFormat: formatZar,
    // Commission rate not confirmed with JV Hart Gallery yet — inherits Plinth's
    // default 40% until the actual figure is provided.
    commissionRate: 0.4,
    deliveryAddress: "593 Jacqueline Dr, Garsfontein, Pretoria",
    dropOffPassPrefix: "JVH-S",
  },
  copy: {
    submitCommissionNote: (ratePct) =>
      `The gallery commission of ${ratePct}% will be added on top of your asking price for the final sale price shown to collectors.`,
  },
};
