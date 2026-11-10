import type { ArtistLinkKind } from "@/lib/artist-profile";

export type SubmissionStatus = "pending" | "approved" | "declined" | "changes";

// An artist can edit their submission until the gallery approves or declines it.
export const isSubmissionEditable = (status: SubmissionStatus) => status === "pending" || status === "changes";

export interface Submission {
  id: string;
  title: string;
  artistId: string;
  artist: string;
  year: number;
  medium: string;
  dim: string;
  price: string;
  forEx: string;
  exhibitionId?: string;
  date: string;
  status: SubmissionStatus;
  note: string;
  ack?: boolean;
  rulesAck?: boolean;
  // The consignment terms the artist agreed to, as they stood at the time.
  termsAgreedAt?: string;
  termsAgreedText?: string;
  termsAgreedPdfPath?: string;
  statement: string;
  imageUrl?: string;
}

export type ExhibitionType = "group" | "solo";
// "open" takes submissions from any artist; "closed" is invitation only.
export type ExhibitionAccess = "open" | "closed";
export type ExhibitionStatus = "open" | "planning" | "hanging" | "closed" | "archived";

export interface Exhibition {
  id: string;
  title: string;
  type: ExhibitionType;
  access: ExhibitionAccess;
  status: ExhibitionStatus;
  blurb: string;
  theme: string;
  mediumRequirements: string;
  sizeRequirements: string;
  rules: string;
  consignmentTermsText: string;
  consignmentTermsPdfPath: string | null;
  maxWorksPerArtist: number | null;
  // Overrides the gallery's default commission for this exhibition; null = default.
  commissionRatePct: number | null;
  filled: number;
  applicants: number;
  submissionDeadline: string | null;
  openingDate: string | null;
  closingDate: string | null;
  deliveryDate: string | null;
  dates: string;
}

export type ExhibitionInviteStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";

export interface ExhibitionInvite {
  id: string;
  exhibitionId: string;
  exhibitionTitle: string;
  artistId: string | null;
  email: string;
  fullName: string;
  message: string;
  status: ExhibitionInviteStatus;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

export type CatalogueStatus = "available" | "sold" | "reserved" | "on loan";

export interface CatalogueWork {
  id: string;
  title: string;
  artistId: string;
  artist: string;
  price: string;
  priceRaw: number | null;
  agreedPrice: string;
  agreedPriceRaw: number | null;
  commissionRatePct: number | null;
  status: CatalogueStatus;
  consignedDate: string;
  consignedDateRaw: string | null;
  submissionId: string | null;
}

export interface Sale {
  id: string;
  catalogueWorkId: string;
  artistId: string;
  artist: string;
  workTitle: string;
  salePrice: string;
  salePriceCents: number;
  discountCents: number;
  commissionRatePct: number;
  commissionAmount: string;
  artistAmount: string;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  soldDate: string;
  soldDateRaw: string;
  buyerPaidDate: string;
  buyerPaidDateRaw: string | null;
  payoutDueDate: string;
  payoutDueDateRaw: string | null;
}

export interface ArtistSale {
  id: string;
  catalogueWorkId: string;
  salePrice: string;
  commissionRatePct: number;
  commissionAmount: string;
  artistAmount: string;
  soldDate: string;
  buyerPaidDate: string;
  payoutDueDate: string;
}

export type PayoutStatus = "due" | "paid" | "acknowledged" | "queried";

export interface Payout {
  id: string;
  saleId: string;
  artistId: string;
  artist: string;
  workTitle: string;
  amount: string;
  amountCents: number;
  status: PayoutStatus;
  dueDate: string;
  dueDateRaw: string | null;
  paidDate: string;
  paidDateRaw: string | null;
  paymentReference: string | null;
  hasProofOfPayment: boolean;
  acknowledgedDate: string;
  acknowledgedDateRaw: string | null;
}

export interface ArtistPayout {
  id: string;
  saleId: string;
  workTitle: string;
  amount: string;
  status: PayoutStatus;
  dueDate: string;
  paidDate: string;
  paymentReference: string | null;
  hasProofOfPayment: boolean;
}

export interface GalleryArtist {
  id: string;
  name: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: "Artist" | "Collector";
  focus: string;
  last: string;
}

export type AuditAction = "insert" | "update" | "delete";

export interface AuditChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface AuditLogEntry {
  id: string;
  entity: string;
  action: AuditAction;
  recordId: string;
  label: string;
  actorEmail: string;
  when: string;
  whenRaw: string;
  changes: AuditChange[];
}

export interface FrameJob {
  title: string;
  artist: string;
  spec: string;
  stage: "queued" | "building" | "ready";
  due: string;
}

export interface MyWork {
  id: string;
  title: string;
  year: number;
  medium: string;
  status: SubmissionStatus;
  date: string;
  note?: string;
  ack?: boolean;
  dim?: string;
  price?: number | null;
  statement?: string;
  imageUrl?: string;
}

export interface OpenCall {
  id: string;
  title: string;
  gallery: string;
  type: ExhibitionType;
  access: ExhibitionAccess;
  deadline: string;
  focus: string;
  theme: string;
  mediumRequirements: string;
  sizeRequirements: string;
  rules: string;
  consignmentTermsText: string;
  consignmentTermsPdfPath: string | null;
  maxWorksPerArtist: number | null;
  commissionRatePct: number | null;
  // Works this artist has already submitted to the call (declined ones don't count).
  myWorkCount: number;
  accepting: boolean;
}

export interface StudioMessage {
  id: string;
  from: string;
  time: string;
  preview: string;
  body: string;
}

export const hasConsignmentTerms = (e: { consignmentTermsText: string; consignmentTermsPdfPath: string | null }) =>
  Boolean(e.consignmentTermsText || e.consignmentTermsPdfPath);

export interface PortfolioWork {
  id: string;
  title: string;
  year: number | null;
  medium: string;
  dimensions: string;
  imageUrl: string;
}

export interface ArtistLink {
  kind: ArtistLinkKind;
  url: string;
}

export type ArtistPhotoKind = "profile" | "studio";

export interface ArtistPhoto {
  id: string;
  kind: ArtistPhotoKind;
  imageUrl: string;
}

// What an artist chooses to show galleries.
export interface ArtistPublicProfile {
  artistId: string;
  name: string;
  city: string;
  practice: string;
  bio: string;
  links: ArtistLink[];
  profilePhoto: ArtistPhoto | null;
  studioPhotos: ArtistPhoto[];
  works: PortfolioWork[];
}
