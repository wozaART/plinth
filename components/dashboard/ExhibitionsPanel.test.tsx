// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { contact, exhibition } from "@/test/fixtures";

const h = vi.hoisted(() => ({
  createExhibition: vi.fn(),
  updateExhibition: vi.fn(),
  archiveExhibition: vi.fn(),
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
  for (const k of ["updateExhibition", "archiveExhibition", "unarchiveExhibition", "deleteExhibition", "inviteArtistToExhibition", "revokeExhibitionInvite"] as const) {
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

  it("archives an exhibition, which then drops out of the list", async () => {
    setup();
    openDetail("Quiet Rooms");
    fireEvent.click(screen.getByRole("button", { name: /Archive/ }));
    await waitFor(() => expect(h.archiveExhibition).toHaveBeenCalledWith("e2"));
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(listed()).toEqual(["Highveld Light"]);
  });

  it("reports when archiving fails", async () => {
    h.archiveExhibition.mockRejectedValue(new Error("Has open submissions"));
    setup();
    openDetail("Quiet Rooms");
    fireEvent.click(screen.getByRole("button", { name: /Archive/ }));
    expect(await screen.findByText("Has open submissions")).toBeTruthy();
  });
});
