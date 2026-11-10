// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { emptyPublicProfile } from "@/lib/artist-profile";
import type { Contact } from "@/lib/types";

const h = vi.hoisted(() => ({
  inviteArtist: vi.fn(),
  createContact: vi.fn(),
  deleteContact: vi.fn(),
  getArtistProfileForContact: vi.fn(),
  getArtistProfileForGallery: vi.fn(),
}));
vi.mock("@/lib/supabase/actions", () => h);

import ContactsPanel from "./ContactsPanel";

const contacts: Contact[] = [
  { id: "c1", name: "Ana Artist", email: "ana@x.co", role: "Artist", focus: "Painting", last: "Today" },
  { id: "c2", name: "Colin Collector", email: "colin@x.co", role: "Collector", focus: "", last: "—" },
];

beforeEach(() => {
  for (const fn of Object.values(h)) fn.mockReset();
  h.inviteArtist.mockResolvedValue(undefined);
});

describe("ContactsPanel artist profiles", () => {
  it("opens an artist contact's profile when the row is tapped", async () => {
    h.getArtistProfileForContact.mockResolvedValue({ ...emptyPublicProfile("a1", "Ana Artist"), bio: "I paint." });
    render(<ContactsPanel data={contacts} />);
    fireEvent.click(screen.getByText("painting", { exact: false }));
    expect(h.getArtistProfileForContact).toHaveBeenCalledWith("c1");
    expect(await screen.findByText("I paint.")).toBeTruthy();
  });

  it("shows why when the artist has no profile to show", async () => {
    h.getArtistProfileForContact.mockRejectedValue(new Error("no profile to show"));
    render(<ContactsPanel data={contacts} />);
    fireEvent.click(screen.getByRole("button", { name: "View Ana Artist's profile" }));
    expect((await screen.findByRole("alert")).textContent).toContain("no profile to show");
  });

  it("does nothing for collectors", () => {
    render(<ContactsPanel data={contacts} />);
    fireEvent.click(screen.getByText("Colin Collector"));
    expect(h.getArtistProfileForContact).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("row buttons don't also open the profile", () => {
    render(<ContactsPanel data={contacts} />);
    fireEvent.click(screen.getByRole("button", { name: "Invite to portal" }));
    expect(h.inviteArtist).toHaveBeenCalled();
    expect(h.getArtistProfileForContact).not.toHaveBeenCalled();
  });
});
