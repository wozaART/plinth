// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ExhibitionInvite } from "@/lib/types";
import { contact, exhibition } from "@/test/fixtures";
import ExhibitionDetailDrawer from "./ExhibitionDetailDrawer";

const inv = (over: Partial<ExhibitionInvite> = {}): ExhibitionInvite => ({
  id: "i1", exhibitionId: "e1", exhibitionTitle: "Highveld Light", artistId: null, email: "ana@example.com", fullName: "Ana Artist",
  message: "", status: "pending", createdAt: "", expiresAt: "", respondedAt: null, ...over,
});

function setup(ex = exhibition(), invites: ExhibitionInvite[] = [], artists = [contact(), contact({ id: "c2", name: "Ben", email: "ben@example.com" })]) {
  const cb = { onClose: vi.fn(), onUpdate: vi.fn(), onArchive: vi.fn(), onUnarchive: vi.fn(), onDelete: vi.fn(), onInvite: vi.fn(), onRevokeInvite: vi.fn() };
  render(<ExhibitionDetailDrawer ex={ex} invites={invites} artistContacts={artists} {...cb} />);
  return cb;
}
const type = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } });
const sendInvite = () => screen.getByRole("button", { name: "Send invite" }) as HTMLButtonElement;

describe("view mode", () => {
  it("shows the exhibition's details, with dashes for anything unset", () => {
    setup(exhibition({ theme: "Light", rules: "Max 3 works", openingDate: "2026-05-01" }));
    expect(screen.getByRole("heading", { name: "Highveld Light" })).toBeTruthy();
    expect(screen.getByText("4/10 filled")).toBeTruthy();
    expect(screen.getByText("Light")).toBeTruthy();
    expect(screen.getByText("Max 3 works")).toBeTruthy();
    expect(screen.getByText("2026-05-01")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("omits the rules block when there are none", () => {
    setup();
    expect(screen.queryByText("Rules for entering")).toBeNull();
  });

  it("closes from the × and the scrim", () => {
    const cb = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(cb.onClose).toHaveBeenCalledTimes(2);
  });
});

describe("edit mode", () => {
  const edit = () => fireEvent.click(screen.getByRole("button", { name: "Edit exhibition" }));

  it("prefills the form and hides the invite and delete sections while editing", () => {
    setup(exhibition({ theme: "Light" }));
    edit();
    expect((screen.getByLabelText(/Title/) as HTMLInputElement).value).toBe("Highveld Light");
    expect((screen.getByLabelText(/Theme/) as HTMLInputElement).value).toBe("Light");
    expect(screen.queryByText("Invite an artist")).toBeNull();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });

  it("saves trimmed changes, converting blanks to null, and returns to view", () => {
    const cb = setup(exhibition({ openingDate: "2026-05-01" }));
    edit();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "  Highveld Dusk " } });
    fireEvent.change(screen.getByLabelText(/Blurb/), { target: { value: " New blurb " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(cb.onUpdate).toHaveBeenCalledWith("e1", expect.objectContaining({
      title: "Highveld Dusk", blurb: "New blurb", type: "group", slots: 10, openingDate: "2026-05-01", submissionDeadline: null, closingDate: null, deliveryDate: null,
    }));
    expect(screen.getByRole("button", { name: "Edit exhibition" })).toBeTruthy();
  });

  it("won't save without a title", () => {
    const cb = setup();
    edit();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(cb.onUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
  });

  it("cancelling discards edits, and reopening starts from the saved values", () => {
    const cb = setup();
    edit();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Changed" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cb.onUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Highveld Light" })).toBeTruthy();
    edit();
    expect((screen.getByLabelText(/Title/) as HTMLInputElement).value).toBe("Highveld Light");
  });
});

describe("inviting artists", () => {
  it("needs an email before it can send", () => {
    setup();
    expect(sendInvite().disabled).toBe(true);
    type("name@studio.co.za", "   ");
    expect(sendInvite().disabled).toBe(true);
    type("name@studio.co.za", "new@example.com");
    expect(sendInvite().disabled).toBe(false);
  });

  it("invites by email with trimmed values and clears the form", () => {
    const cb = setup();
    type("Name", " New Artist ");
    type("name@studio.co.za", " new@example.com ");
    type("Personal note (optional)", " Hope you can join ");
    fireEvent.click(sendInvite());
    expect(cb.onInvite).toHaveBeenCalledWith("e1", { existingArtistId: undefined, email: "new@example.com", fullName: "New Artist" }, "Hope you can join");
    expect((screen.getByPlaceholderText("name@studio.co.za") as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText("Personal note (optional)") as HTMLInputElement).value).toBe("");
  });

  it("omits the note when it's blank", () => {
    const cb = setup();
    type("name@studio.co.za", "new@example.com");
    fireEvent.click(sendInvite());
    expect(cb.onInvite.mock.calls[0][2]).toBeUndefined();
  });

  it("invites an existing artist contact, hiding the manual fields", () => {
    const cb = setup();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "c2" } });
    expect(screen.queryByPlaceholderText("name@studio.co.za")).toBeNull();
    expect(sendInvite().disabled).toBe(false);
    fireEvent.click(sendInvite());
    expect(cb.onInvite).toHaveBeenCalledWith("e1", { existingArtistId: undefined, email: "ben@example.com", fullName: "Ben" }, undefined);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("");
  });

  it("switching to an existing contact clears anything typed", () => {
    setup();
    type("name@studio.co.za", "typed@example.com");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "c1" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect((screen.getByPlaceholderText("name@studio.co.za") as HTMLInputElement).value).toBe("");
  });

  it("lists invitations with their status, falling back to the email when there's no name", () => {
    setup(exhibition(), [inv(), inv({ id: "i2", fullName: "", email: "x@example.com", status: "accepted" }), inv({ id: "i3", status: "revoked" })]);
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("Revoked")).toBeTruthy();
    expect(screen.getAllByText("x@example.com")).toHaveLength(2);
  });

  it("only lets pending invitations be revoked", () => {
    const cb = setup(exhibition(), [inv(), inv({ id: "i2", status: "accepted" })]);
    const revoke = screen.getAllByRole("button", { name: "Revoke" });
    expect(revoke).toHaveLength(1);
    fireEvent.click(revoke[0]);
    expect(cb.onRevokeInvite).toHaveBeenCalledWith("i1");
  });
});

describe("archive and delete", () => {
  it("archives an active exhibition", () => {
    const cb = setup();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(cb.onArchive).toHaveBeenCalledWith("e1");
    expect(screen.queryByRole("button", { name: "Restore from archive" })).toBeNull();
  });

  it("restores an archived exhibition", () => {
    const cb = setup(exhibition({ status: "archived" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore from archive" }));
    expect(cb.onUnarchive).toHaveBeenCalledWith("e1");
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });

  it("needs a second click to delete an exhibition with no submissions", () => {
    const cb = setup(exhibition({ applicants: 0 }));
    fireEvent.click(screen.getByRole("button", { name: "Delete exhibition" }));
    expect(cb.onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete?" }));
    expect(cb.onDelete).toHaveBeenCalledWith("e1");
  });

  it("blocks deleting an exhibition that has submissions, pointing to archive instead", () => {
    const cb = setup(exhibition({ applicants: 3 }));
    const btn = screen.getByRole("button", { name: "Delete exhibition" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.title).toMatch(/archive instead/);
    fireEvent.click(btn);
    expect(cb.onDelete).not.toHaveBeenCalled();
  });
});
