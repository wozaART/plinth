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
  title: string;
  gallery: string;
  deadline: string;
  focus: string;
  accepting: boolean;
}

export interface StudioMessage {
  id: string;
  from: string;
  time: string;
  preview: string;
  body: string;
}
