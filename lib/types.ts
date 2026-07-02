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
  statement: string;
}

export interface Exhibition {
  title: string;
  dates: string;
  status: "open" | "planning" | "hanging" | "closed";
  blurb: string;
  slots: number;
  filled: number;
  applicants: number;
}

export interface CatalogueWork {
  title: string;
  artist: string;
  price: string;
  status: "available" | "sold" | "reserved" | "on loan";
}

export interface Contact {
  name: string;
  email: string;
  role: "Artist" | "Collector";
  focus: string;
  last: string;
}

export interface FrameJob {
  title: string;
  artist: string;
  spec: string;
  stage: "queued" | "building" | "ready";
  due: string;
}
