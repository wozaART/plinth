// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CreateExhibitionDrawer from "./CreateExhibitionDrawer";

const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const fillDates = () => {
  type(/Online submission deadline/, "2026-01-30");
  type(/Delivery date/, "2026-03-02");
  type(/Opening date/, "2026-03-12");
  type(/Closing date/, "2026-04-18");
};

function setup() {
  const onCreate = vi.fn();
  const onClose = vi.fn();
  render(<CreateExhibitionDrawer onClose={onClose} onCreate={onCreate} />);
  const create = () => screen.getByRole("button", { name: "Create exhibition" }) as HTMLButtonElement;
  return { onCreate, onClose, create };
}

describe("CreateExhibitionDrawer", () => {
  it("needs all four dates", () => {
    const { create, onCreate } = setup();
    type(/Title/, "Highveld Light");
    expect(create().disabled).toBe(true);
    type(/Online submission deadline/, "2026-01-30");
    type(/Delivery date/, "2026-03-02");
    type(/Opening date/, "2026-03-12");
    expect(create().disabled).toBe(true);
    fireEvent.click(create());
    expect(onCreate).not.toHaveBeenCalled();
    type(/Closing date/, "2026-04-18");
    expect(create().disabled).toBe(false);
  });

  it("needs a title", () => {
    const { create, onCreate } = setup();
    expect(create().disabled).toBe(true);
    type(/Title/, "   ");
    fillDates();
    expect(create().disabled).toBe(true);
    fireEvent.click(create());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("creates a group show with 8 slots by default", () => {
    const { create, onCreate } = setup();
    type(/Title/, " Highveld Light ");
    fillDates();
    fireEvent.click(create());
    expect(onCreate).toHaveBeenCalledWith({
      title: "Highveld Light",
      type: "group",
      access: "open",
      blurb: "",
      theme: "",
      mediumRequirements: "",
      sizeRequirements: "",
      rules: "",
      slots: 8,
      submissionDeadline: "2026-01-30",
      openingDate: "2026-03-12",
      closingDate: "2026-04-18",
      deliveryDate: "2026-03-02",
    });
  });

  it("sends every field, trimmed", () => {
    const { create, onCreate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "solo" }));
    fireEvent.click(screen.getByRole("button", { name: "Invite only" }));
    type(/Title/, "Quiet Rooms");
    type(/Blurb/, " A solo show ");
    type(/Theme/, " Interiors ");
    type(/Medium requirements/, " Oil ");
    type(/Size requirements/, " Max 150cm ");
    type(/Rules for entering/, " Two works max ");
    type(/Slots/, "3");
    type(/Online submission deadline/, "2026-01-30");
    type(/Delivery date/, "2026-03-02");
    type(/Opening date/, "2026-03-12");
    type(/Closing date/, "2026-04-18");
    fireEvent.click(create());
    expect(onCreate).toHaveBeenCalledWith({
      title: "Quiet Rooms",
      type: "solo",
      access: "closed",
      blurb: "A solo show",
      theme: "Interiors",
      mediumRequirements: "Oil",
      sizeRequirements: "Max 150cm",
      rules: "Two works max",
      slots: 3,
      submissionDeadline: "2026-01-30",
      openingDate: "2026-03-12",
      closingDate: "2026-04-18",
      deliveryDate: "2026-03-02",
    });
  });

  it("treats a non-numeric slot count as 0", () => {
    const { create, onCreate } = setup();
    type(/Title/, "X");
    fillDates();
    type(/Slots/, "");
    fireEvent.click(create());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ slots: 0 }));
  });

  it("closes from ×, Cancel and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
