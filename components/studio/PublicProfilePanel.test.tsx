// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { emptyPublicProfile } from "@/lib/artist-profile";
import type { ArtistPublicProfile, PortfolioWork } from "@/lib/types";

const h = vi.hoisted(() => ({
  saveArtistAbout: vi.fn(),
  addPortfolioWork: vi.fn(),
  updatePortfolioWork: vi.fn(),
  deletePortfolioWork: vi.fn(),
  addArtistPhoto: vi.fn(),
  deleteArtistPhoto: vi.fn(),
  uploadProfileImage: vi.fn(),
}));
vi.mock("@/lib/supabase/actions", () => ({
  saveArtistAbout: h.saveArtistAbout,
  addPortfolioWork: h.addPortfolioWork,
  updatePortfolioWork: h.updatePortfolioWork,
  deletePortfolioWork: h.deletePortfolioWork,
  addArtistPhoto: h.addArtistPhoto,
  deleteArtistPhoto: h.deleteArtistPhoto,
}));
vi.mock("@/lib/profile-image-upload", async () => ({
  ...(await vi.importActual<typeof import("@/lib/profile-image-upload")>("@/lib/profile-image-upload")),
  uploadProfileImage: h.uploadProfileImage,
}));

import PublicProfilePanel from "./PublicProfilePanel";

const work = (n: number): PortfolioWork => ({ id: `w${n}`, title: `Work ${n}`, year: 2024, medium: "Oil", dimensions: "", imageUrl: `https://img/${n}.jpg` });
const png = () => new File(["x"], "pic.png", { type: "image/png" });

let notify: ReturnType<typeof vi.fn<(message: string) => void>>;
const setup = (over: Partial<ArtistPublicProfile> = {}) => {
  notify = vi.fn<(message: string) => void>();
  return render(<PublicProfilePanel initial={{ ...emptyPublicProfile("a1", "Ana"), ...over }} onNotify={notify} />);
};

beforeEach(() => {
  for (const fn of Object.values(h)) fn.mockReset();
  h.uploadProfileImage.mockResolvedValue("a1/new/1.png");
});

describe("PublicProfilePanel", () => {
  it("states what galleries can and can't see", () => {
    setup();
    expect(screen.getByText(/never shown/)).toBeTruthy();
  });

  describe("portfolio", () => {
    it("lists existing works with a count out of ten", () => {
      setup({ works: [work(1), work(2)] });
      expect(screen.getByText("Work 1")).toBeTruthy();
      expect(screen.getByText("(2/10)")).toBeTruthy();
    });

    it("disables adding at ten works", () => {
      setup({ works: Array.from({ length: 10 }, (_, i) => work(i + 1)) });
      expect((screen.getByRole("button", { name: "+ Add work" }) as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByText(/reached the limit/)).toBeTruthy();
    });

    it("uploads the photo, then saves the new work", async () => {
      h.addPortfolioWork.mockImplementation(async (input) => ({ id: input.id, title: input.title, year: input.year, medium: input.medium, dimensions: input.dimensions, imageUrl: "https://img/new.jpg" }));
      setup();
      fireEvent.click(screen.getByRole("button", { name: "+ Add work" }));
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Low Tide" } });
      fireEvent.change(screen.getByLabelText("Year"), { target: { value: "2024" } });
      fireEvent.change(screen.getByLabelText("Work photo"), { target: { files: [png()] } });
      fireEvent.click(screen.getByRole("button", { name: "Add to portfolio" }));

      await waitFor(() => expect(h.addPortfolioWork).toHaveBeenCalled());
      expect(h.addPortfolioWork.mock.calls[0][0]).toMatchObject({ title: "Low Tide", year: 2024, imagePath: "a1/new/1.png" });
      expect(h.uploadProfileImage.mock.calls[0][0]).toBe(h.addPortfolioWork.mock.calls[0][0].id);
      await waitFor(() => expect(screen.getByText("Low Tide")).toBeTruthy());
    });

    it("won't save without a title or a photo", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: "+ Add work" }));
      fireEvent.click(screen.getByRole("button", { name: "Add to portfolio" }));
      expect(notify).toHaveBeenCalledWith("Give the work a title.");
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Low Tide" } });
      fireEvent.click(screen.getByRole("button", { name: "Add to portfolio" }));
      expect(notify).toHaveBeenLastCalledWith("Add a photo of the work.");
      expect(h.addPortfolioWork).not.toHaveBeenCalled();
    });

    it("reports a failed save and keeps the form open", async () => {
      h.addPortfolioWork.mockRejectedValue(new Error("Limit of 10 reached."));
      setup();
      fireEvent.click(screen.getByRole("button", { name: "+ Add work" }));
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Low Tide" } });
      fireEvent.change(screen.getByLabelText("Work photo"), { target: { files: [png()] } });
      fireEvent.click(screen.getByRole("button", { name: "Add to portfolio" }));
      await waitFor(() => expect(notify).toHaveBeenCalledWith("Limit of 10 reached."));
      expect(screen.getByRole("button", { name: "Add to portfolio" })).toBeTruthy();
    });

    it("asks for confirmation before removing a work", async () => {
      h.deletePortfolioWork.mockResolvedValue(undefined);
      setup({ works: [work(1)] });
      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      expect(h.deletePortfolioWork).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Confirm?" }));
      await waitFor(() => expect(h.deletePortfolioWork).toHaveBeenCalledWith("w1"));
      await waitFor(() => expect(screen.queryByText("Work 1")).toBeNull());
    });

    it("edits a work without requiring a new photo", async () => {
      h.updatePortfolioWork.mockImplementation(async (input) => ({ ...work(1), title: input.title }));
      setup({ works: [work(1)] });
      fireEvent.click(screen.getByRole("button", { name: "Edit" }));
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Renamed" } });
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(h.updatePortfolioWork).toHaveBeenCalled());
      expect(h.updatePortfolioWork.mock.calls[0][0]).toMatchObject({ id: "w1", title: "Renamed", imagePath: undefined });
      expect(h.uploadProfileImage).not.toHaveBeenCalled();
    });
  });

  describe("links and bio", () => {
    it("saves the bio and links, dropping blank link rows", async () => {
      h.saveArtistAbout.mockImplementation(async (input) => ({ links: input.links }));
      setup();
      fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "I paint." } });
      fireEvent.click(screen.getByRole("button", { name: "+ Add link" }));
      fireEvent.click(screen.getByRole("button", { name: "+ Add link" }));
      const addresses = screen.getAllByLabelText("Link address");
      fireEvent.change(addresses[0], { target: { value: "ana.art" } });
      fireEvent.click(screen.getByRole("button", { name: "Save about & links" }));

      await waitFor(() => expect(h.saveArtistAbout).toHaveBeenCalled());
      expect(h.saveArtistAbout.mock.calls[0][0]).toMatchObject({ bio: "I paint.", links: [{ kind: "website", url: "ana.art" }] });
      await waitFor(() => expect(notify).toHaveBeenCalledWith("Public profile saved."));
    });

    it("shows the server's message when a link is rejected", async () => {
      h.saveArtistAbout.mockRejectedValue(new Error(`"nope" isn't a valid web address.`));
      setup({ links: [{ kind: "website", url: "nope" }] });
      fireEvent.click(screen.getByRole("button", { name: "Save about & links" }));
      await waitFor(() => expect(notify).toHaveBeenCalledWith(`"nope" isn't a valid web address.`));
    });

    it("caps links at ten", () => {
      setup({ links: Array.from({ length: 10 }, (_, i) => ({ kind: "website" as const, url: `https://a${i}.art` })) });
      expect((screen.getByRole("button", { name: "+ Add link" }) as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("photos", () => {
    it("uploads a profile photo", async () => {
      h.addArtistPhoto.mockImplementation(async (input) => ({ id: input.id, kind: input.kind, imageUrl: "https://img/me.jpg" }));
      setup();
      fireEvent.change(screen.getByLabelText("Choose profile photo"), { target: { files: [png()] } });
      await waitFor(() => expect(h.addArtistPhoto).toHaveBeenCalledWith(expect.objectContaining({ kind: "profile", imagePath: "a1/new/1.png" })));
      await waitFor(() => expect(screen.getByRole("button", { name: "Replace photo" })).toBeTruthy());
    });

    it("rejects non-images before uploading", () => {
      setup();
      fireEvent.change(screen.getByLabelText("Choose studio photo"), { target: { files: [new File(["x"], "a.pdf", { type: "application/pdf" })] } });
      expect(notify).toHaveBeenCalledWith("Choose an image file.");
      expect(h.uploadProfileImage).not.toHaveBeenCalled();
    });

    it("limits studio photos to six", () => {
      const studio = Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, kind: "studio" as const, imageUrl: `https://img/s${i}.jpg` }));
      setup({ studioPhotos: studio });
      expect((screen.getByRole("button", { name: "Add studio photo" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("removes a studio photo", async () => {
      h.deleteArtistPhoto.mockResolvedValue(undefined);
      setup({ studioPhotos: [{ id: "s1", kind: "studio", imageUrl: "https://img/s1.jpg" }] });
      fireEvent.click(screen.getByRole("button", { name: "Remove studio photo" }));
      await waitFor(() => expect(h.deleteArtistPhoto).toHaveBeenCalledWith("s1"));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Remove studio photo" })).toBeNull());
    });
  });
});
