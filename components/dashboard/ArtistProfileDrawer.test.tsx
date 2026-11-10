// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { emptyPublicProfile } from "@/lib/artist-profile";

const h = vi.hoisted(() => ({ getArtistProfileForGallery: vi.fn() }));
vi.mock("@/lib/supabase/actions", () => ({ getArtistProfileForGallery: h.getArtistProfileForGallery }));

import ArtistProfileDrawer from "./ArtistProfileDrawer";

const full = {
  ...emptyPublicProfile("a1", "Ana Artist"),
  city: "Durban",
  practice: "Painter",
  bio: "I paint the coast.",
  links: [{ kind: "instagram" as const, url: "https://instagram.com/ana" }],
  profilePhoto: { id: "p1", kind: "profile" as const, imageUrl: "https://img/p1.jpg" },
  studioPhotos: [{ id: "s1", kind: "studio" as const, imageUrl: "https://img/s1.jpg" }],
  works: [{ id: "w1", title: "Low Tide", year: 2024, medium: "Oil", dimensions: "10 x 10 cm", imageUrl: "https://img/w1.jpg" }],
};

const setup = () => render(<ArtistProfileDrawer artistId="a1" artistName="Ana Artist" onClose={vi.fn()} />);

beforeEach(() => {
  h.getArtistProfileForGallery.mockReset();
});

describe("ArtistProfileDrawer", () => {
  it("shows the name while loading, then the full profile", async () => {
    h.getArtistProfileForGallery.mockResolvedValue(full);
    setup();
    expect(screen.getByText("Loading profile…")).toBeTruthy();
    expect(screen.getByText("Ana Artist")).toBeTruthy();

    await waitFor(() => expect(screen.getByText("I paint the coast.")).toBeTruthy());
    expect(h.getArtistProfileForGallery).toHaveBeenCalledWith("a1");
    expect(screen.getByText("Painter · Durban")).toBeTruthy();
    expect(screen.getByText("Low Tide")).toBeTruthy();
    expect(screen.getByText("2024 · Oil · 10 x 10 cm")).toBeTruthy();
    expect(screen.getByRole("button", { name: "View studio photo" })).toBeTruthy();
  });

  it("opens links in a new tab without leaking the opener", async () => {
    h.getArtistProfileForGallery.mockResolvedValue(full);
    setup();
    const link = await screen.findByRole("link", { name: /Instagram/ });
    expect(link.getAttribute("href")).toBe("https://instagram.com/ana");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("says so when the artist hasn't filled anything in", async () => {
    h.getArtistProfileForGallery.mockResolvedValue(emptyPublicProfile("a1", "Ana Artist"));
    setup();
    await waitFor(() => expect(screen.getByText(/hasn.t filled in their profile yet/)).toBeTruthy());
  });

  it("shows an error when the profile can't be loaded", async () => {
    h.getArtistProfileForGallery.mockRejectedValue(new Error("This artist's profile isn't available."));
    setup();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("isn't available"));
  });

  it("closes from the × button", async () => {
    h.getArtistProfileForGallery.mockResolvedValue(full);
    const onClose = vi.fn();
    render(<ArtistProfileDrawer artistId="a1" artistName="Ana Artist" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
