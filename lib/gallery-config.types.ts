export type SubmissionStatus = "pending" | "approved" | "declined" | "changes";

export interface StatusColorSet {
  bg: string;
  fg: string;
  dot: string;
}

export interface StatusPanelColorSet extends StatusColorSet {
  panelBg: string;
  panelBorder: string;
}

export interface GalleryThemeColors {
  accent: string;
  accentHover: string;
  onAccent: string;

  /** Fill/text pair for solid "primary action" surfaces (active filter pills,
   * primary buttons, toasts). Kept separate from text/onDark because in a
   * dark-mode gallery theme those two can collapse to the same color. */
  solid: string;
  onSolid: string;

  bgApp: string;
  bgShell: string;
  sidebar: string;
  surface: string;
  surfaceDark: string;

  text: string;
  textBody: string;
  textSecondary: string;
  textMuted: string;
  textSoft: string;
  textFaint: string;
  textEyebrow: string;
  onDark: string;
  onDarkSoft: string;
  onDarkFaint: string;

  border: string;
  borderStrong: string;
  borderInput: string;
  borderChip: string;
  divider: string;
  borderDark: string;

  status: {
    pending: StatusColorSet;
    approved: StatusPanelColorSet;
    declined: StatusPanelColorSet;
    changes: StatusPanelColorSet;
  };
  neutralChipBg: string;
  neutralChipFg: string;
}

export interface GalleryFontChoice {
  /** Google Fonts family name, e.g. "Newsreader" or "Cinzel" */
  googleFont: string;
  weights?: string[];
  styles?: string[];
}

export interface GalleryConfig {
  identity: {
    slug: string;
    name: string;
    shortName: string;
    tagline: string;
    city: string;
    logoWordmark?: { primary: string; secondary?: string };
    logoImageUrl?: string;
  };
  theme: {
    mode: "light" | "dark";
    colors: GalleryThemeColors;
    fonts: {
      display: GalleryFontChoice;
      body: GalleryFontChoice;
      mono?: GalleryFontChoice;
    };
  };
  nav: {
    galleryTabs: Array<{ id: string; label: string; enabled: boolean }>;
    studioTabs: Array<{ id: string; label: string; enabled: boolean }>;
  };
  business: {
    currencyFormat: (amount: number) => string;
    commissionRate: number;
    deliveryAddress: string;
    dropOffPassPrefix: string;
  };
  copy: {
    submitCommissionNote: (ratePct: number) => string;
  };
}
