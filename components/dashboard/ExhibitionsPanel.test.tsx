// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { contact, exhibition, submission } from "@/test/fixtures";

const h = vi.hoisted(() => ({
  createExhibition: vi.fn(),
  updateExhibition: vi.fn(),
  archiveExhibitionWithCatalogue: vi.fn(),
  unarchiveExhibition: vi.fn(),
  deleteExhibition: vi.fn(),
  inviteArtistToExhibition: vi.fn(),
  revokeExhibitionInvite: vi.fn(),
}));
vi.mock("@/lib/supabase/actions", () => h);

import ExhibitionsPanel from "./ExhibitionsPanel";

const data = [
  exhibition({ id: "e1", title: "Highveld Light", status: "open", slots: 10, filled: 4, applicants: 7 }),
  exhibition({ id: "e2", title: "Quiet Rooms", type: "solo", status: "planning", slots: 1, filled: 0, applicants: 0, blurb: "" }),
  exhibition({ id: "e3", title: "Old Show", status: "archived" }),
];

const setup = () => render(<ExhibitionsPanel data={data} invites={[]} contacts={[contact(), contact({ id: "c2", name: "Cora", role: "Collector" })]} />);
const listed = () => ["Highveld Light", "Quiet Rooms", "Old Show"].filter((t) => screen.queryByText(t));
const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

beforeEach(() => {
  for (const fn of Object.values(h)) fn.mockReset();
  h.createExhibition.mockResolvedValue({ id: "new-id" });
  for (const k of ["updateExhibition", "archiveExhibitionWithCatalogue", "unarchiveExhibition", "deleteExhibition", "inviteArtistToExhibition", "revokeExhibitionInvite"] as const) {
    h[k].mockResolvedValue(undefined);
  }
});

describe("ExhibitionsPanel list", () => {
  it("hides archived exhibitions until asked", () => {
    setup();
    expect(listed()).toEqual(["Highveld Light", "Quiet Rooms"]);
    fireEvent.click(screen.getByRole("button", { name: "Show archived" }));
    expect(listed()).toEqual(["Highveld Light", "Quiet Rooms", "Old Show"]);
    expect(screen.getByRole("button", { name: "Showing archived" })).toBeTruthy();
  });

  it("shows status, slots filled, applicants and remaining slots", () => {
    setup();
    expect(screen.getByText("Open call")).toBeTruthy();
    expect(screen.getByText("Planning")).toBeTruthy();
    expect(screen.getByText("7 applicants")).toBeTruthy();
    expect(screen.getByText("6 slots remaining")).toBeTruthy();
  });

  it("handles an exhibition with no slots without dividing by zero", () => {
    render(<ExhibitionsPanel data={[exhibition({ slots: 0, filled: 0 })]} invites={[]} contacts={[]} />);
    expect(screen.getByText("0 slots remaining")).toBeTruthy();
  });
});

describe("ExhibitionsPanel creating", () => {
  function create() {
    fireEvent.click(screen.getByRole("button", { name: "+ New exhibition" }));
    type(/Title/, "Fresh Show");
    fireEvent.click(screen.getByRole("button", { name: "Create exhibition" }));
  }

  it("adds the exhibition as planning right away and saves it", async () => {
    setup();
    create();
    expect(screen.getByText("Fresh Show")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create exhibition" })).toBeNull();
    await waitFor(() => expect(h.createExhibition).toHaveBeenCalledWith(expect.objectContaining({ title: "Fresh Show", type: "group", slots: 8 })));
  });

  it("removes it again and explains when saving fails", async () => {
    h.createExhibition.mockRejectedValue(new Error("Title taken"));
    setup();
    create();
    expect(await screen.findByText("Title taken")).toBeTruthy();
    expect(screen.queryByText("Fresh Show")).toBeNull();
  });

  it("uses a generic message for non-Error failures", async () => {
    h.createExhibition.mockRejectedValue("x");
    setup();
    create();
    expect(await screen.findByText("Couldn't create exhibition — try again")).toBeTruthy();
  });
});

describe("ExhibitionsPanel detail drawer", () => {
  const openDetail = (title: string) => fireEvent.click(screen.getByText(title));

  it("opens an exhibition's details and closes them", () => {
    setup();
    openDetail("Highveld Light");
    expect(screen.getByRole("heading", { name: "Highveld Light", level: 2 })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(screen.queryByRole("heading", { name: "Highveld Light", level: 2 })).toBeNull();
  });

  const subs = [
    submission({ id: "a1", title: "Approved One", status: "approved", exhibitionId: "e2" }),
    submission({ id: "a2", title: "Approved Two", status: "approved", exhibitionId: "e2" }),
    submission({ id: "p1", title: "Still Pending", status: "pending", exhibitionId: "e2" }),
    submission({ id: "c1", title: "Already Catalogued", status: "approved", exhibitionId: "e2" }),
    submission({ id: "x1", title: "Other Show", status: "approved", exhibitionId: "e1" }),
  ];
  const archiveSetup = () => {
    render(<ExhibitionsPanel data={data} invites={[]} contacts={[]} submissions={subs} catalogueSubmissionIds={["c1"]} />);
    openDetail("Quiet Rooms");
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
  };
  const box = (title: string) => screen.getByLabelText(`Add ${title} to catalogue`) as HTMLInputElement;

  it("does not archive until the dialog is completed, and cancelling leaves it unchanged", () => {
    archiveSetup();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(h.archiveExhibitionWithCatalogue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(h.archiveExhibitionWithCatalogue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(listed()).toEqual(["Highveld Light", "Quiet Rooms"]);
  });

  it("lists only this exhibition's submissions; only approved, uncatalogued ones are selectable", () => {
    archiveSetup();
    expect(screen.queryByText("Other Show")).toBeNull();
    expect(box("Approved One").disabled).toBe(false);
    expect(box("Still Pending").disabled).toBe(true);
    expect(box("Already Catalogued").disabled).toBe(true);
    expect(box("Already Catalogued").checked).toBe(true);
    expect(screen.getByText("0 to catalogue · 3 to archive")).toBeTruthy();
  });

  it("archives with the chosen submissions, which then drops the exhibition from the list", async () => {
    archiveSetup();
    fireEvent.click(box("Approved Two"));
    expect(screen.getByText("1 to catalogue · 2 to archive")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Archive exhibition" }));
    await waitFor(() => expect(h.archiveExhibitionWithCatalogue).toHaveBeenCalledWith("e2", ["a2"]));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(listed()).toEqual(["Highveld Light"]);
  });

  it("archives an exhibition with no submissions", async () => {
    setup();
    openDetail("Quiet Rooms");
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByText("This exhibition has no submissions.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Archive exhibition" }));
    await waitFor(() => expect(h.archiveExhibitionWithCatalogue).toHaveBeenCalledWith("e2", []));
  });

  it("reports when archiving fails and keeps the dialog open", async () => {
    h.archiveExhibitionWithCatalogue.mockRejectedValue(new Error("Has open submissions"));
    archiveSetup();
    fireEvent.click(screen.getByRole("button", { name: "Archive exhibition" }));
    expect(await screen.findByText("Has open submissions")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
