// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithGallery } from "@/test/gallery-config";
import { catalogueWork } from "@/test/fixtures";

const h = vi.hoisted(() => ({
  createCatalogueWork: vi.fn(),
  updateCatalogueWork: vi.fn(),
  updateCatalogueWorkStatus: vi.fn(),
  deleteCatalogueWork: vi.fn(),
  recordSale: vi.fn(),
}));
vi.mock("@/lib/supabase/actions", () => h);

import CataloguePanel from "./CataloguePanel";

const artists = [
  { id: "a1", name: "Ana Artist" },
  { id: "a2", name: "Ben Brush" },
];
const works = [
  catalogueWork({ id: "w1", title: "Harbour", status: "available" }),
  catalogueWork({ id: "w2", title: "Karoo", artist: "Ben Brush", artistId: "a2", status: "sold", price: "R 31 000" }),
  catalogueWork({ id: "w3", title: "Dune", status: "reserved" }),
];

const render = () => renderWithGallery(<CataloguePanel data={works} artists={artists} />);
const rows = () => screen.getAllByRole("row").slice(1);
const titles = () => rows().map((r) => within(r).getAllByRole("cell")[0].textContent);
const row = (title: string) => rows().find((r) => within(r).getAllByRole("cell")[0].textContent === title)!;
const statusOf = (title: string) => (within(row(title)).getByRole("combobox") as HTMLSelectElement).value;
const chip = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

beforeEach(() => {
  for (const fn of Object.values(h)) fn.mockReset();
  h.createCatalogueWork.mockResolvedValue({ id: "new-id" });
  h.updateCatalogueWork.mockResolvedValue(undefined);
  h.updateCatalogueWorkStatus.mockResolvedValue(undefined);
  h.deleteCatalogueWork.mockResolvedValue(undefined);
  h.recordSale.mockResolvedValue({ noticeError: null });
});

describe("CataloguePanel list", () => {
  it("lists works with artist, price and status", () => {
    render();
    expect(titles()).toEqual(["Harbour", "Karoo", "Dune"]);
    expect(within(row("Karoo")).getAllByRole("cell")[1].textContent).toBe("Ben Brush");
    expect(within(row("Karoo")).getAllByRole("cell")[2].textContent).toBe("R 31 000");
    expect(statusOf("Dune")).toBe("reserved");
  });

  it.each([
    ["available", ["Harbour"]],
    ["sold", ["Karoo"]],
    ["reserved", ["Dune"]],
    ["all", ["Harbour", "Karoo", "Dune"]],
  ])("filters by %s", (name, expected) => {
    render();
    chip(name);
    expect(titles()).toEqual(expected);
  });

  it("explains an empty filter", () => {
    render();
    chip("on loan");
    expect(screen.getByText("No works in this filter.")).toBeTruthy();
  });
});

describe("CataloguePanel adding", () => {
  function addWork() {
    fireEvent.click(screen.getByRole("button", { name: "+ Add work" }));
    type(/Title/, "Dusk");
    type(/Listed price/, "12000");
    fireEvent.click(screen.getByRole("button", { name: "Add work" }));
  }

  it("adds the work straight away, then swaps in the saved id", async () => {
    render();
    addWork();
    expect(titles()[0]).toBe("Dusk");
    expect(screen.getByText('"Dusk" added to the catalogue.')).toBeTruthy();
    expect(screen.queryByLabelText(/Title/)).toBeNull();
    await waitFor(() => expect(h.createCatalogueWork).toHaveBeenCalledWith(expect.objectContaining({ title: "Dusk", artistId: "a1", price: 12000 })));
    expect(within(row("Dusk")).getAllByRole("cell")[2].textContent).toMatch(/^R\s*12\s?000$/);
  });

  it("takes the work back out and says why when saving fails", async () => {
    h.createCatalogueWork.mockRejectedValue(new Error("Artist not found"));
    render();
    addWork();
    expect(await screen.findByText("Artist not found")).toBeTruthy();
    expect(titles()).not.toContain("Dusk");
  });

  it("uses a generic message for non-Error failures", async () => {
    h.createCatalogueWork.mockRejectedValue("x");
    render();
    addWork();
    expect(await screen.findByText('Couldn\'t add "Dusk" — try again.')).toBeTruthy();
  });
});

describe("CataloguePanel status changes", () => {
  const change = (title: string, to: string) =>
    fireEvent.change(within(row(title)).getByRole("combobox"), { target: { value: to } });

  it("changes status immediately and saves it", async () => {
    render();
    change("Harbour", "on loan");
    expect(statusOf("Harbour")).toBe("on loan");
    await waitFor(() => expect(h.updateCatalogueWorkStatus).toHaveBeenCalledWith("w1", "on loan"));
  });

  it("reverts and reports when saving the status fails", async () => {
    h.updateCatalogueWorkStatus.mockRejectedValue(new Error("Locked"));
    render();
    change("Harbour", "reserved");
    expect(await screen.findByText("Locked")).toBeTruthy();
    expect(statusOf("Harbour")).toBe("available");
  });

  it("uses a generic message when the failure has no message", async () => {
    h.updateCatalogueWorkStatus.mockRejectedValue("x");
    render();
    change("Harbour", "reserved");
    expect(await screen.findByText("Couldn't update that status — try again.")).toBeTruthy();
  });

  it("opens the sale form instead of marking sold directly", () => {
    render();
    change("Harbour", "sold");
    expect(h.updateCatalogueWorkStatus).not.toHaveBeenCalled();
    expect(statusOf("Harbour")).toBe("available");
    expect(screen.getByRole("button", { name: "Confirm sale" })).toBeTruthy();
  });
});

describe("CataloguePanel recording a sale", () => {
  function startSale() {
    fireEvent.change(within(row("Harbour")).getByRole("combobox"), { target: { value: "sold" } });
  }

  it("records the sale and marks the work sold", async () => {
    render();
    startSale();
    fireEvent.click(screen.getByRole("button", { name: "Confirm sale" }));
    expect(await screen.findByText('"Harbour" marked as sold.')).toBeTruthy();
    expect(h.recordSale).toHaveBeenCalledWith(expect.objectContaining({ catalogueWorkId: "w1", salePriceCents: 1800000, commissionRatePct: 35 }));
    expect(statusOf("Harbour")).toBe("sold");
    expect(screen.queryByRole("button", { name: "Confirm sale" })).toBeNull();
  });

  it("says when the artist couldn't be notified", async () => {
    h.recordSale.mockResolvedValue({ noticeError: "email bounced" });
    render();
    startSale();
    fireEvent.click(screen.getByRole("button", { name: "Confirm sale" }));
    expect(await screen.findByText('"Harbour" marked as sold, but the artist wasn\'t notified: email bounced')).toBeTruthy();
    expect(statusOf("Harbour")).toBe("sold");
  });

  it("leaves the work unsold and the form open when recording fails", async () => {
    h.recordSale.mockRejectedValue(new Error("Already sold"));
    render();
    startSale();
    fireEvent.click(screen.getByRole("button", { name: "Confirm sale" }));
    expect(await screen.findByText("Already sold")).toBeTruthy();
    expect(statusOf("Harbour")).toBe("available");
    expect(screen.getByRole("button", { name: "Confirm sale" })).toBeTruthy();
  });

  it("can be cancelled without recording anything", () => {
    render();
    startSale();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(h.recordSale).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Confirm sale" })).toBeNull();
  });
});

describe("CataloguePanel editing and removing", () => {
  const edit = (title: string) => fireEvent.click(within(row(title)).getAllByRole("cell")[0]);

  it("saves edits optimistically", async () => {
    render();
    edit("Harbour");
    type(/Title/, "Harbour II");
    type(/Listed price/, "25000");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Catalogue entry updated.")).toBeTruthy();
    expect(titles()[0]).toBe("Harbour II");
    expect(within(row("Harbour II")).getAllByRole("cell")[2].textContent).toMatch(/^R\s*25\s?000$/);
    await waitFor(() => expect(h.updateCatalogueWork).toHaveBeenCalledWith("w1", expect.objectContaining({ title: "Harbour II", price: 25000 })));
  });

  it("restores the old values and reports when saving fails", async () => {
    h.updateCatalogueWork.mockRejectedValue(new Error("Conflict"));
    render();
    edit("Harbour");
    type(/Title/, "Harbour II");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Conflict")).toBeTruthy();
    expect(titles()[0]).toBe("Harbour");
  });

  it("removes a work after confirmation", async () => {
    render();
    edit("Harbour");
    fireEvent.click(screen.getByRole("button", { name: "Remove from catalogue" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm remove?" }));
    expect(titles()).toEqual(["Karoo", "Dune"]);
    await waitFor(() => expect(h.deleteCatalogueWork).toHaveBeenCalledWith("w1"));
  });

  it("brings the work back and reports when removal fails", async () => {
    h.deleteCatalogueWork.mockRejectedValue(new Error("Has sales"));
    render();
    edit("Harbour");
    fireEvent.click(screen.getByRole("button", { name: "Remove from catalogue" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm remove?" }));
    expect(await screen.findByText("Has sales")).toBeTruthy();
    expect(titles()).toEqual(["Harbour", "Karoo", "Dune"]);
  });
});
