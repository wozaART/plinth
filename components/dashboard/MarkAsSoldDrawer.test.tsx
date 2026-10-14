// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import MarkAsSoldDrawer from "./MarkAsSoldDrawer";
import { renderWithGallery } from "@/test/gallery-config";
import { catalogueWork } from "@/test/fixtures";
import { formatCurrency } from "@/lib/currency";

const money = (n: number) => formatCurrency(n, "ZAR");
const value = (label: RegExp) => (screen.getByLabelText(label) as HTMLInputElement).value;
const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const summary = (label: string) => screen.getByText(label).parentElement!.textContent!;
const confirm = () => screen.getByRole("button", { name: /Confirm sale|Recording/ }) as HTMLButtonElement;

function setup(work = catalogueWork(), onConfirm = vi.fn(), onClose = vi.fn()) {
  renderWithGallery(<MarkAsSoldDrawer work={work} onClose={onClose} onConfirm={onConfirm} />);
  return { onConfirm, onClose };
}

describe("MarkAsSoldDrawer defaults", () => {
  it("starts from the agreed price, the work's commission and today's date", () => {
    setup();
    expect(value(/Sale price/)).toBe("18000");
    expect(value(/Commission %/)).toBe("35");
    expect(value(/Sold on/)).toBe(new Date().toISOString().slice(0, 10));
  });

  it("falls back to the listed price, then the gallery's default commission", () => {
    setup(catalogueWork({ agreedPriceRaw: null, commissionRatePct: null }));
    expect(value(/Sale price/)).toBe("20000");
    expect(value(/Commission %/)).toBe("40");
  });

  it("leaves the price blank, and confirm disabled, when the work has no price", () => {
    setup(catalogueWork({ agreedPriceRaw: null, priceRaw: null }));
    expect(value(/Sale price/)).toBe("");
    expect(confirm().disabled).toBe(true);
  });

  it("names the work and artist", () => {
    setup();
    expect(screen.getByRole("heading").textContent).toContain("Harbour at Dusk");
    expect(screen.getByText(/Catalogue · Ana Artist/)).toBeTruthy();
  });
});

describe("MarkAsSoldDrawer split", () => {
  it("shows net, commission and artist share live as the form changes", () => {
    setup();
    type(/Sale price/, "1000");
    type(/Discount/, "100");
    type(/Commission %/, "40");
    expect(summary("Net of discount")).toContain(money(900));
    expect(summary("Gallery commission")).toContain(money(360));
    expect(summary("Artist receives")).toContain(money(540));
  });

  it("ignores currency symbols and spaces when parsing amounts", () => {
    setup();
    type(/Sale price/, "R 1 500");
    expect(summary("Net of discount")).toContain(money(1500));
  });

  it("caps the discount at the sale price", () => {
    setup();
    type(/Sale price/, "500");
    type(/Discount/, "900");
    expect(summary("Net of discount")).toContain(money(0));
    expect(summary("Artist receives")).toContain(money(0));
  });

  it("gives the whole sale to the artist at 0% commission and to the gallery at 100%", () => {
    setup();
    type(/Sale price/, "1000");
    type(/Commission %/, "0");
    expect(summary("Artist receives")).toContain(money(1000));
    type(/Commission %/, "100");
    expect(summary("Gallery commission")).toContain(money(1000));
    expect(summary("Artist receives")).toContain(money(0));
  });

  it("rounds the commission to the nearest cent", () => {
    setup();
    type(/Sale price/, "0.99");
    type(/Commission %/, "33.3");
    // 99c * 0.333 = 32.967c -> 33c
    expect(summary("Gallery commission")).toContain(money(0.33));
    expect(summary("Artist receives")).toContain(money(0.66));
  });
});

describe("MarkAsSoldDrawer submit", () => {
  it("is disabled without a positive price or a commission", () => {
    setup();
    type(/Sale price/, "");
    expect(confirm().disabled).toBe(true);
    type(/Sale price/, "0");
    expect(confirm().disabled).toBe(true);
    type(/Sale price/, "100");
    expect(confirm().disabled).toBe(false);
    type(/Commission %/, "  ");
    expect(confirm().disabled).toBe(true);
  });

  it("sends the sale in cents with blank optional fields as null", () => {
    const { onConfirm } = setup();
    type(/Sale price/, "1000");
    type(/Discount/, "100");
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledWith({
      catalogueWorkId: "w1",
      salePriceCents: 100000,
      discountCents: 10000,
      commissionRatePct: 35,
      buyerName: null,
      buyerEmail: null,
      buyerPhone: null,
      soldDate: new Date().toISOString().slice(0, 10),
      buyerPaidDate: null,
      payoutDueDate: null,
    });
  });

  it("trims buyer details and passes through the dates", () => {
    const { onConfirm } = setup();
    type(/Buyer name/, "  Bo Buyer ");
    type(/Buyer email/, " bo@example.com ");
    type(/Buyer phone/, " 082 000 0000 ");
    type(/Sold on/, "2026-03-05");
    type(/Buyer paid on/, "2026-03-06");
    type(/Payout due/, "2026-04-05");
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerName: "Bo Buyer",
        buyerEmail: "bo@example.com",
        buyerPhone: "082 000 0000",
        soldDate: "2026-03-05",
        buyerPaidDate: "2026-03-06",
        payoutDueDate: "2026-04-05",
      }),
    );
  });

  it("caps the sent discount at the price", () => {
    const { onConfirm } = setup();
    type(/Sale price/, "500");
    type(/Discount/, "900");
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ salePriceCents: 50000, discountCents: 50000 }));
  });

  it("disables the button and shows progress while confirming, then re-enables it", async () => {
    let finish!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (finish = r)));
    setup(catalogueWork(), onConfirm as never);
    fireEvent.click(confirm());
    await waitFor(() => expect(confirm().textContent).toBe("Recording…"));
    expect(confirm().disabled).toBe(true);
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(confirm().textContent).toBe("Confirm sale"));
    expect(confirm().disabled).toBe(false);
  });
});

describe("MarkAsSoldDrawer closing", () => {
  it("closes from the × button, Cancel, and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
