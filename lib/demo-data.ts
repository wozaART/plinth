import type {
  Submission, Exhibition, ExhibitionInvite, CatalogueWork, GalleryArtist, Contact,
  FrameJob, Payout, AuditLogEntry, MyWork, OpenCall, StudioMessage, ArtistPayout,
} from "./types";

// Static sample content for the public, non-functional demo portals
// (/demo/gallery and /demo/artist). Nothing here touches the database.

const submission = (s: Partial<Submission> & Pick<Submission, "id" | "title" | "artist" | "status">): Submission => ({
  year: 2025, medium: "Oil on canvas", dim: "90 × 120 cm", price: "R 24 000", forEx: "Open Call 2026",
  date: "12 Sep 2025", note: "", statement: "A study of light and land, painted over one winter.", ...s,
});

export const demoSubmissions: Submission[] = [
  submission({ id: "s1", title: "Salt Pan", artist: "Thandi Mokoena", status: "pending" }),
  submission({ id: "s2", title: "Red Ground", artist: "Nomvula Zulu", status: "pending", medium: "Acrylic on board", price: "R 18 500" }),
  submission({ id: "s3", title: "Veld at First Light", artist: "Pieter Naudé", status: "approved", date: "3 Sep 2025" }),
  submission({ id: "s4", title: "City Grid", artist: "Lerato Dlamini", status: "declined", ack: false, medium: "Digital print", price: "R 9 800", note: "Thank you for submitting. The work doesn't fit the theme of this exhibition, but we'd love to see more." }),
];

export const demoExhibitions: Exhibition[] = [
  {
    id: "e1", title: "Open Call 2026", type: "group", status: "open", blurb: "A group show on land and memory.", theme: "Land & memory",
    mediumRequirements: "Painting, drawing, print", sizeRequirements: "Up to 150 cm on the longest side", rules: "Max two works per artist.",
    slots: 24, filled: 9, applicants: 17, submissionDeadline: "2026-01-30", openingDate: "2026-03-12", closingDate: "2026-04-18", deliveryDate: "2026-03-02", dates: "12 Mar – 18 Apr 2026",
  },
  {
    id: "e2", title: "Quiet Rooms", type: "solo", status: "planning", blurb: "Solo exhibition by Pieter Naudé.", theme: "Interiors",
    mediumRequirements: "Oil on canvas", sizeRequirements: "Mixed", rules: "",
    slots: 1, filled: 1, applicants: 0, submissionDeadline: null, openingDate: "2026-06-05", closingDate: "2026-07-04", deliveryDate: "2026-05-25", dates: "5 Jun – 4 Jul 2026",
  },
];

export const demoExhibitionInvites: ExhibitionInvite[] = [];

export const demoCatalogueArtists: GalleryArtist[] = [
  { id: "a1", name: "Thandi Mokoena" }, { id: "a2", name: "Nomvula Zulu" }, { id: "a3", name: "Pieter Naudé" },
];

const work = (w: Partial<CatalogueWork> & Pick<CatalogueWork, "id" | "title" | "artistId" | "artist">): CatalogueWork => ({
  price: "R 24 000", priceRaw: 24000, agreedPrice: "R 24 000", agreedPriceRaw: 24000, commissionRatePct: 40,
  status: "available", consignedDate: "2 Aug 2025", consignedDateRaw: "2025-08-02", submissionId: null, ...w,
});

export const demoCatalogue: CatalogueWork[] = [
  work({ id: "c1", title: "Veld at First Light", artistId: "a3", artist: "Pieter Naudé" }),
  work({ id: "c2", title: "Low Tide", artistId: "a1", artist: "Thandi Mokoena", price: "R 12 000", priceRaw: 12000, agreedPrice: "R 12 000", agreedPriceRaw: 12000, status: "sold" }),
  work({ id: "c3", title: "Karoo Study II", artistId: "a2", artist: "Nomvula Zulu", status: "reserved", price: "R 31 000", priceRaw: 31000, agreedPrice: "R 31 000", agreedPriceRaw: 31000 }),
];

export const demoContacts: Contact[] = [
  { id: "k1", name: "Thandi Mokoena", email: "thandi@example.com", role: "Artist", focus: "Painting", last: "2 days ago" },
  { id: "k2", name: "Nomvula Zulu", email: "nomvula@example.com", role: "Artist", focus: "Mixed media", last: "1 week ago" },
  { id: "k3", name: "Anna van der Merwe", email: "anna@example.com", role: "Collector", focus: "Landscape", last: "3 weeks ago" },
];

export const demoFrameJobs: FrameJob[] = [
  { title: "Veld at First Light", artist: "Pieter Naudé", spec: "Oak, 3 cm, museum glass", stage: "building", due: "20 Feb" },
  { title: "Low Tide", artist: "Thandi Mokoena", spec: "Black float frame", stage: "ready", due: "14 Feb" },
];

export const demoPayouts: Payout[] = [
  {
    id: "p1", saleId: "sale1", artistId: "a1", artist: "Thandi Mokoena", workTitle: "Low Tide", amount: "R 7 200", amountCents: 720000,
    status: "due", dueDate: "28 Feb 2026", dueDateRaw: "2026-02-28", paidDate: "", paidDateRaw: null, paymentReference: null,
    hasProofOfPayment: false, acknowledgedDate: "", acknowledgedDateRaw: null,
  },
];

export const demoAuditLog: AuditLogEntry[] = [
  { id: "l1", entity: "Submission", action: "update", recordId: "s3", label: "Veld at First Light approved", actorEmail: "gallery@example.com", when: "2 days ago", whenRaw: "2026-01-10T09:00:00Z" },
  { id: "l2", entity: "Catalogue work", action: "insert", recordId: "c3", label: "Karoo Study II added", actorEmail: "gallery@example.com", when: "1 week ago", whenRaw: "2026-01-04T09:00:00Z" },
];

export const demoWorks: MyWork[] = [
  { id: "w1", title: "City Grid", year: 2025, medium: "Digital print", status: "declined", date: "12 Sep 2025", note: "Thank you for submitting. The work doesn't fit the theme of this exhibition, but we'd love to see more.", ack: false },
  { id: "w2", title: "Salt Pan", year: 2025, medium: "Oil on canvas", status: "pending", date: "20 Sep 2025" },
  { id: "w3", title: "Veld at First Light", year: 2025, medium: "Oil on canvas", status: "approved", date: "3 Sep 2025" },
];

export const demoOpenCalls: OpenCall[] = [
  {
    id: "oc1", title: "Open Call 2026", gallery: "Your Gallery", type: "group", deadline: "30 Jan 2026", focus: "Painting, drawing, print",
    theme: "Land & memory", mediumRequirements: "Painting, drawing, print", sizeRequirements: "Up to 150 cm on the longest side",
    rules: "Max two works per artist.", accepting: true,
  },
];

export const demoMessages: StudioMessage[] = [
  { id: "m1", from: "Gallery", time: "Yesterday", preview: "Your drop-off pass is ready", body: "Your drop-off pass is ready. Please deliver between 9:00 and 16:00 on weekdays." },
];

export const demoArtistPayouts: ArtistPayout[] = [];

export const demoArtistProfile = {
  firstName: "Lerato", lastName: "Dlamini", phone: "", email: "lerato@example.com",
  accountNumber: "", bankName: "", branchCode: "", accountType: "Cheque",
};
