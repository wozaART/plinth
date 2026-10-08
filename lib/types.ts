export type SubmissionStatus = "pending" | "approved" | "declined" | "changes";

export interface Submission {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dim: string;
  price: string;
  forEx: string;
  date: string;
  status: SubmissionStatus;
  note: string;
  ack?: boolean;
  rulesAck?: boolean;
  statement: string;
}

export type ExhibitionType = "group" | "solo";
export type ExhibitionStatus = "open" | "planning" | "hanging" | "closed" | "archived";

export interface Exhibition {
  id: string;
  title: string;
  type: ExhibitionType;
  status: ExhibitionStatus;
  blurb: string;
  theme: string;
  mediumRequirements: string;
  sizeRequirements: string;
  rules: string;
  slots: number;
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

export interface AuditLogEntry {
  id: string;
  entity: string;
  action: AuditAction;
  recordId: string;
  label: string;
  actorEmail: string;
  when: string;
  whenRaw: string;
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
}

export interface OpenCall {
  id: string;
  title: string;
  gallery: string;
  type: ExhibitionType;
  deadline: string;
  focus: string;
  theme: string;
  mediumRequirements: string;
  sizeRequirements: string;
  rules: string;
  accepting: boolean;
}

export interface StudioMessage {
  id: string;
  from: string;
  time: string;
  preview: string;
  body: string;
}
