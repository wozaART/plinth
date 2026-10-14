// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AddCatalogueWorkDrawer from "./AddCatalogueWorkDrawer";
import EditCatalogueWorkDrawer from "./EditCatalogueWorkDrawer";
import { catalogueWork } from "@/test/fixtures";

const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const input = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;
const today = () => new Date().toISOString().slice(0, 10);

describe("AddCatalogueWorkDrawer", () => {
  const artists = [
    { id: "a1", name: "Ana Artist" },
    { id: "a2", name: "Ben Brush" },
  ];

  function setup(list = artists) {
    const onCreate = vi.fn();
    const onClose = vi.fn();
    render(<AddCatalogueWorkDrawer artists={list} onClose={onClose} onCreate={onCreate} />);
    const add = () => screen.getByRole("button", { name: "Add work" }) as HTMLButtonElement;
    return { onCreate, onClose, add };
  }

  it("lists the gallery's artists, with the first selected", () => {
    setup();
    const select = screen.getByLabelText(/Artist/) as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["Ana Artist", "Ben Brush"]);
    expect(select.value).toBe("a1");
    expect(input(/Consigned on/).value).toBe(today());
  });

  it("needs a title before it can be added", () => {
    const { add, onCreate } = setup();
    expect(add().disabled).toBe(true);
    type(/Title/, "   ");
    expect(add().disabled).toBe(true);
    fireEvent.click(add());
    expect(onCreate).not.toHaveBeenCalled();
    type(/Title/, "Dusk");
    expect(add().disabled).toBe(false);
  });

  it("can't be added when the gallery has no artists yet", () => {
    const { add } = setup([]);
    type(/Title/, "Dusk");
    expect(add().disabled).toBe(true);
  });

  it("sends a minimal work with nulls for blank prices and commission", () => {
    const { add, onCreate } = setup();
    type(/Title/, "  Dusk ");
    fireEvent.click(add());
    expect(onCreate).toHaveBeenCalledWith({
      artistId: "a1",
      artistName: "Ana Artist",
      title: "Dusk",
      price: null,
      agreedPrice: null,
      commissionRatePct: null,
      consignedDate: today(),
      status: "available",
    });
  });

  it("sends the chosen artist, cleaned prices, commission, date and status", () => {
    const { add, onCreate } = setup();
    fireEvent.change(screen.getByLabelText(/Artist/), { target: { value: "a2" } });
    type(/Title/, "Dusk");
    type(/Listed price/, "R 20 000");
    type(/Agreed with artist/, "18000.50");
    type(/Commission %/, "35");
    type(/Consigned on/, "2026-02-03");
    fireEvent.click(screen.getByRole("button", { name: "reserved" }));
    fireEvent.click(add());
    expect(onCreate).toHaveBeenCalledWith({
      artistId: "a2",
      artistName: "Ben Brush",
      title: "Dusk",
      price: 20000,
      agreedPrice: 18000.5,
      commissionRatePct: 35,
      consignedDate: "2026-02-03",
      status: "reserved",
    });
  });

  it("sends no consigned date when cleared", () => {
    const { add, onCreate } = setup();
    type(/Title/, "Dusk");
    type(/Consigned on/, "");
    fireEvent.click(add());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ consignedDate: null }));
  });

  it("closes from ×, Cancel and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe("EditCatalogueWorkDrawer", () => {
  function setup(work = catalogueWork()) {
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(<EditCatalogueWorkDrawer work={work} onClose={onClose} onSave={onSave} onDelete={onDelete} />);
    const save = () => screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement;
    return { onSave, onDelete, onClose, save };
  }

  it("is pre-filled from the work", () => {
    setup();
    expect(input(/Title/).value).toBe("Harbour at Dusk");
    expect(input(/Listed price/).value).toBe("20000");
    expect(input(/Agreed with artist/).value).toBe("18000");
    expect(input(/Commission %/).value).toBe("35");
    expect(input(/Consigned on/).value).toBe("2026-03-01");
  });

  it("leaves unset values blank", () => {
    setup(catalogueWork({ priceRaw: null, agreedPriceRaw: null, commissionRatePct: null, consignedDateRaw: null }));
    expect(input(/Listed price/).value).toBe("");
    expect(input(/Agreed with artist/).value).toBe("");
    expect(input(/Commission %/).value).toBe("");
    expect(input(/Consigned on/).value).toBe("");
  });

  it("saves the unchanged work as-is", () => {
    const { save, onSave } = setup();
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith("w1", {
      title: "Harbour at Dusk",
      price: 20000,
      agreedPrice: 18000,
      commissionRatePct: 35,
      consignedDate: "2026-03-01",
      status: "available",
    });
  });

  it("saves edits, clearing values to null", () => {
    const { save, onSave } = setup();
    type(/Title/, " New title ");
    type(/Listed price/, "R 25 500");
    type(/Agreed with artist/, "");
    type(/Commission %/, "");
    type(/Consigned on/, "");
    fireEvent.click(screen.getByRole("button", { name: "on loan" }));
    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledWith("w1", {
      title: "New title",
      price: 25500,
      agreedPrice: null,
      commissionRatePct: null,
      consignedDate: null,
      status: "on loan",
    });
  });

  it("can't be saved without a title", () => {
    const { save, onSave } = setup();
    type(/Title/, "  ");
    expect(save().disabled).toBe(true);
    fireEvent.click(save());
    expect(onSave).not.toHaveBeenCalled();
  });

  it("asks for confirmation before removing the work", () => {
    const { onDelete } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Remove from catalogue" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm remove?" }));
    expect(onDelete).toHaveBeenCalledWith("w1");
  });

  it("closes from ×, Cancel and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
