// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MarkPayoutPaidDrawer from "./MarkPayoutPaidDrawer";
import { payout } from "@/test/fixtures";

const today = () => new Date().toISOString().slice(0, 10);
const confirm = () => screen.getByRole("button", { name: /Confirm payout|Saving/ }) as HTMLButtonElement;

function setup(onConfirm = vi.fn(), onClose = vi.fn()) {
  render(<MarkPayoutPaidDrawer payout={payout()} onClose={onClose} onConfirm={onConfirm} />);
  return { onConfirm, onClose };
}

describe("MarkPayoutPaidDrawer", () => {
  it("shows the amount, artist, work and due date", () => {
    setup();
    expect(screen.getByRole("heading").textContent).toBe("Mark R 9 000 as paid");
    expect(screen.getByText(/Payout · Ana Artist/)).toBeTruthy();
    expect(screen.getByText(/Harbour at Dusk/).textContent).toContain("due 1 Jan");
  });

  it("defaults the paid date to today", () => {
    setup();
    expect((screen.getByLabelText(/Paid on/) as HTMLInputElement).value).toBe(today());
  });

  it("sends the payout with a trimmed reference and no proof by default", () => {
    const { onConfirm } = setup();
    fireEvent.change(screen.getByLabelText(/Payment reference/), { target: { value: "  REF-1 " } });
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledWith({ payoutId: "p1", paidDate: today(), paymentReference: "REF-1", proofOfPayment: null });
  });

  it("sends a blank reference as null and the chosen proof file", () => {
    const { onConfirm } = setup();
    const file = new File(["x"], "proof.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Proof of payment/), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText(/Paid on/), { target: { value: "2026-05-01" } });
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledWith({ payoutId: "p1", paidDate: "2026-05-01", paymentReference: null, proofOfPayment: file });
  });

  it("only accepts images and PDFs as proof", () => {
    setup();
    expect(screen.getByLabelText(/Proof of payment/).getAttribute("accept")).toBe("image/*,application/pdf");
  });

  it("can't be confirmed without a paid date", () => {
    const { onConfirm } = setup();
    fireEvent.change(screen.getByLabelText(/Paid on/), { target: { value: "" } });
    expect(confirm().disabled).toBe(true);
    fireEvent.click(confirm());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows progress and blocks double submits while saving", async () => {
    let finish!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (finish = r)));
    setup(onConfirm as never);
    fireEvent.click(confirm());
    await waitFor(() => expect(confirm().textContent).toBe("Saving…"));
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(confirm().textContent).toBe("Confirm payout"));
  });

  it("closes from ×, Cancel and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
