// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithGallery } from "@/test/gallery-config";
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
  renderWithGallery(<CreateExhibitionDrawer onClose={onClose} onCreate={onCreate} />);
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

  it("creates a group show with no works limit by default", () => {
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
      consignmentTermsText: "",
      consignmentTermsPdfPath: null,
      maxWorksPerArtist: null,
      commissionRatePct: null,
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
    type(/Maximum works per artist/, "3");
    type(/Commission/, "35");
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
      consignmentTermsText: "",
      consignmentTermsPdfPath: null,
      maxWorksPerArtist: 3,
      commissionRatePct: 35,
      submissionDeadline: "2026-01-30",
      openingDate: "2026-03-12",
      closingDate: "2026-04-18",
      deliveryDate: "2026-03-02",
    });
  });

  it("sends typed consignment terms, trimmed", () => {
    const { create, onCreate } = setup();
    type(/Title/, "X");
    fillDates();
    fireEvent.click(screen.getByRole("button", { name: "Type or paste" }));
    fireEvent.change(screen.getByLabelText("Consignment terms", { selector: "textarea" }), { target: { value: " Commission is 40%. " } });
    fireEvent.click(create());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ consignmentTermsText: "Commission is 40%." }));
    expect(onCreate.mock.calls[0][0]).not.toHaveProperty("consignmentTermsPdfFile");
  });

  it("hands up a chosen terms PDF for upload", () => {
    const { create, onCreate } = setup();
    type(/Title/, "X");
    fillDates();
    fireEvent.click(screen.getByRole("button", { name: "Upload PDF" }));
    const file = new File(["%PDF-1.4"], "terms.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Consignment terms PDF"), { target: { files: [file] } });
    fireEvent.click(create());
    expect(onCreate.mock.calls[0][0].consignmentTermsPdfFile).toBe(file);
    expect(onCreate.mock.calls[0][0]).not.toHaveProperty("consignmentTermsText");
  });

  it("rejects a non-PDF terms file", () => {
    const { create, onCreate } = setup();
    type(/Title/, "X");
    fillDates();
    fireEvent.click(screen.getByRole("button", { name: "Upload PDF" }));
    const file = new File(["x"], "terms.docx", { type: "application/msword" });
    fireEvent.change(screen.getByLabelText("Consignment terms PDF"), { target: { files: [file] } });
    expect(screen.getByText("Please choose a PDF file.")).toBeTruthy();
    fireEvent.click(create());
    expect(onCreate.mock.calls[0][0]).not.toHaveProperty("consignmentTermsPdfFile");
  });

  it("treats a blank works limit as no limit", () => {
    const { create, onCreate } = setup();
    type(/Title/, "X");
    fillDates();
    type(/Maximum works per artist/, "");
    fireEvent.click(create());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ maxWorksPerArtist: null }));
  });

  it("closes from ×, Cancel and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
