// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { submission } from "@/test/fixtures";

const h = vi.hoisted(() => ({ decideSubmission: vi.fn(), acceptSubmissionIntoCatalogue: vi.fn() }));
vi.mock("@/lib/supabase/actions", () => h);

import SubmissionsPanel from "./SubmissionsPanel";

const data = [
  submission({ id: "s1", title: "Salt Pan", status: "pending" }),
  submission({ id: "s2", title: "Red Ground", status: "pending", artist: "Ben" }),
  submission({ id: "s3", title: "Veld", status: "approved" }),
  submission({ id: "s4", title: "City Grid", status: "declined", ack: false, note: "Not a fit" }),
  submission({ id: "s5", title: "Tide", status: "changes", note: "Crop it" }),
];

const ALL_TITLES = ["Salt Pan", "Red Ground", "Veld", "City Grid", "Tide"];
// Titles currently listed, in list order (a title appears once, on its card).
const cardTitles = () => ALL_TITLES.filter((t) => screen.queryByText(t));
const filter = (re: RegExp) => fireEvent.click(screen.getByRole("button", { name: re }));
const open = (title: string) => fireEvent.click(screen.getByText(title));

beforeEach(() => {
  h.decideSubmission.mockReset();
  h.acceptSubmissionIntoCatalogue.mockReset();
  h.decideSubmission.mockResolvedValue(undefined);
  h.acceptSubmissionIntoCatalogue.mockResolvedValue(undefined);
});

describe("SubmissionsPanel list and filters", () => {
  it("shows every submission with counts on the filter chips", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    expect(cardTitles()).toEqual(["Salt Pan", "Red Ground", "Veld", "City Grid", "Tide"]);
    expect(screen.getByRole("button", { name: /^All\s*5$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Pending review\s*2$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Approved\s*1$/ })).toBeTruthy();
  });

  it.each([
    [/^Pending review/, ["Salt Pan", "Red Ground"]],
    [/^Approved/, ["Veld"]],
    [/^Declined/, ["City Grid"]],
    [/^Changes requested/, ["Tide"]],
    [/^All/, ["Salt Pan", "Red Ground", "Veld", "City Grid", "Tide"]],
  ])("filters by %s", (re, expected) => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    filter(re);
    expect(cardTitles()).toEqual(expected);
  });

  it("explains an empty filter and shows no count for it", () => {
    render(<SubmissionsPanel initialData={[submission()]} catalogueSubmissionIds={[]} />);
    filter(/^Declined/);
    expect(screen.getByText("No submissions in this filter.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Declined$/ })).toBeTruthy();
  });

  it("flags declined work the artist hasn't acknowledged", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    expect(screen.getAllByText(/Awaiting acknowledgement/)).toHaveLength(1);
  });
});

describe("SubmissionsPanel reviewing", () => {
  function decideOn(title: string) {
    open(title);
    fireEvent.click(screen.getByRole("button", { name: "Make a decision" }));
  }

  it("opens a submission in the review drawer and closes it", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    open("Salt Pan");
    expect(screen.getByRole("heading", { name: "Salt Pan" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(screen.queryByRole("heading", { name: "Salt Pan" })).toBeNull();
  });

  it("approves: updates the card, saves, and confirms", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    decideOn("Salt Pan");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(h.decideSubmission).toHaveBeenCalledWith("s1", "approved", "");
    expect(screen.getByText("Work approved — drop-off pass issued.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Pending review\s*1$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Approved\s*2$/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Salt Pan" })).toBeNull();
  });

  it("declines with a note and marks it awaiting acknowledgement", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    decideOn("Red Ground");
    fireEvent.change(screen.getByPlaceholderText(/kind, honest response/), { target: { value: "Sorry" } });
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(h.decideSubmission).toHaveBeenCalledWith("s2", "declined", "Sorry");
    expect(screen.getByText("Work declined — artist will be notified.")).toBeTruthy();
    expect(screen.getAllByText(/Awaiting acknowledgement/)).toHaveLength(2);
  });

  it("requests changes with a note", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    decideOn("Salt Pan");
    fireEvent.change(screen.getByPlaceholderText(/kind, honest response/), { target: { value: "Crop" } });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    expect(h.decideSubmission).toHaveBeenCalledWith("s1", "changes", "Crop");
    expect(screen.getByText("Changes requested — artist notified.")).toBeTruthy();
  });

  it("won't decline or request changes without a note", () => {
    render(<SubmissionsPanel initialData={data} catalogueSubmissionIds={[]} />);
    decideOn("Salt Pan");
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(h.decideSubmission).not.toHaveBeenCalled();
  });
});

describe("SubmissionsPanel accepting into the catalogue", () => {
  const approved = [submission({ id: "s3", title: "Veld", status: "approved" })];

  it("adds an approved work to the catalogue and then shows it's there", async () => {
    render(<SubmissionsPanel initialData={approved} catalogueSubmissionIds={[]} />);
    open("Veld");
    fireEvent.click(screen.getByRole("button", { name: "Accept into catalogue" }));
    expect(await screen.findByText("Added to the catalogue.")).toBeTruthy();
    expect(h.acceptSubmissionIntoCatalogue).toHaveBeenCalledWith("s3");
    expect((screen.getByRole("button", { name: "In the catalogue" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows works already in the catalogue as such", () => {
    render(<SubmissionsPanel initialData={approved} catalogueSubmissionIds={["s3"]} />);
    open("Veld");
    expect(screen.getByRole("button", { name: "In the catalogue" })).toBeTruthy();
  });

  it("reports failure and allows a retry", async () => {
    h.acceptSubmissionIntoCatalogue.mockRejectedValue(new Error("Already consigned"));
    render(<SubmissionsPanel initialData={approved} catalogueSubmissionIds={[]} />);
    open("Veld");
    fireEvent.click(screen.getByRole("button", { name: "Accept into catalogue" }));
    expect(await screen.findByText("Already consigned")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Accept into catalogue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("uses a generic message for non-Error failures", async () => {
    h.acceptSubmissionIntoCatalogue.mockRejectedValue("x");
    render(<SubmissionsPanel initialData={approved} catalogueSubmissionIds={[]} />);
    open("Veld");
    fireEvent.click(screen.getByRole("button", { name: "Accept into catalogue" }));
    expect(await screen.findByText("Couldn't add that work to the catalogue — try again.")).toBeTruthy();
  });
});
