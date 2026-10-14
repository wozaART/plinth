// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { payout } from "@/test/fixtures";

const h = vi.hoisted(() => ({ markPayoutPaid: vi.fn() }));
vi.mock("@/lib/supabase/actions", () => ({ markPayoutPaid: h.markPayoutPaid }));

import PayoutsPanel from "./PayoutsPanel";

const data = [
  payout({ id: "due-future", workTitle: "Future Work", artist: "Ana", dueDateRaw: "2099-01-01" }),
  payout({ id: "due-past", workTitle: "Late Work", artist: "Ben", dueDateRaw: "2020-01-01", dueDate: "1 Jan" }),
  payout({ id: "paid", workTitle: "Paid Work", artist: "Cy", status: "paid", dueDateRaw: "2020-01-01" }),
  payout({ id: "ack", workTitle: "Acked Work", artist: "Di", status: "acknowledged", dueDateRaw: "2020-01-01" }),
  payout({ id: "queried", workTitle: "Queried Work", artist: "Ed", status: "queried", dueDateRaw: null }),
];

const rows = () => screen.getAllByRole("row").slice(1);
const titles = () => rows().map((r) => within(r).getAllByRole("cell")[0].textContent);
const row = (title: string) => rows().find((r) => within(r).getAllByRole("cell")[0].textContent === title)!;
const chip = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  h.markPayoutPaid.mockReset();
  h.markPayoutPaid.mockResolvedValue({ noticeError: null });
});

describe("PayoutsPanel list", () => {
  it("shows every payout with its status, overdue ones flagged", () => {
    render(<PayoutsPanel data={data} />);
    expect(titles()).toEqual(["Future Work", "Late Work", "Paid Work", "Acked Work", "Queried Work"]);
    const status = (t: string) => within(row(t)).getAllByRole("cell")[4].textContent;
    expect(status("Future Work")).toBe("Due");
    expect(status("Late Work")).toBe("Overdue");
    expect(status("Paid Work")).toBe("Paid");
    expect(status("Acked Work")).toBe("Acknowledged");
    expect(status("Queried Work")).toBe("Queried");
  });

  it("doesn't call a payout without a due date overdue", () => {
    render(<PayoutsPanel data={[payout({ dueDateRaw: null })]} />);
    expect(screen.getByText("Due", { selector: "span" })).toBeTruthy();
  });

  it("shows an empty message when there's nothing to list", () => {
    render(<PayoutsPanel data={[]} />);
    expect(screen.getByText("No payouts in this filter.")).toBeTruthy();
  });

  it("only offers 'Mark as paid' on due payouts", () => {
    render(<PayoutsPanel data={data} />);
    expect(screen.getAllByRole("button", { name: "Mark as paid" })).toHaveLength(2);
    expect(within(row("Paid Work")).queryByRole("button")).toBeNull();
  });
});

describe("PayoutsPanel filters", () => {
  it.each([
    ["Due", ["Future Work"]],
    ["Overdue", ["Late Work"]],
    ["Awaiting acknowledgement", ["Paid Work"]],
    ["All", ["Future Work", "Late Work", "Paid Work", "Acked Work", "Queried Work"]],
  ])("%s", (filter, expected) => {
    render(<PayoutsPanel data={data} />);
    chip(filter);
    expect(titles()).toEqual(expected);
  });

  it("explains when a filter has no matches", () => {
    render(<PayoutsPanel data={[payout()]} />);
    chip("Overdue");
    expect(screen.getByText("No payouts in this filter.")).toBeTruthy();
  });
});

describe("PayoutsPanel marking paid", () => {
  const openFor = (title: string) => fireEvent.click(within(row(title)).getByRole("button", { name: "Mark as paid" }));

  it("opens the drawer for the chosen payout and can be cancelled", () => {
    render(<PayoutsPanel data={data} />);
    openFor("Late Work");
    expect(screen.getByText(/Payout · Ben/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/Payout · Ben/)).toBeNull();
  });

  it("records the payout, updates the row and confirms with a toast", async () => {
    render(<PayoutsPanel data={data} />);
    openFor("Late Work");
    fireEvent.change(screen.getByLabelText(/Paid on/), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/Payment reference/), { target: { value: "REF9" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm payout" }));

    expect(await screen.findByText("Marked R 9 000 to Ben as paid.")).toBeTruthy();
    expect(h.markPayoutPaid).toHaveBeenCalledWith({ payoutId: "due-past", paidDate: "2026-05-01", paymentReference: "REF9", proofOfPayment: null });
    expect(within(row("Late Work")).getAllByRole("cell")[4].textContent).toBe("Paid");
    expect(within(row("Late Work")).queryByRole("button")).toBeNull();
    expect(screen.queryByText(/Payout · Ben/)).toBeNull();
  });

  it("still marks it paid, but says so, when the artist couldn't be notified", async () => {
    h.markPayoutPaid.mockResolvedValue({ noticeError: "email bounced" });
    render(<PayoutsPanel data={data} />);
    openFor("Late Work");
    fireEvent.click(screen.getByRole("button", { name: "Confirm payout" }));
    expect(await screen.findByText("Marked as paid, but Ben wasn't notified: email bounced")).toBeTruthy();
    expect(within(row("Late Work")).getAllByRole("cell")[4].textContent).toBe("Paid");
  });

  it("keeps the payout due and the drawer open when recording fails", async () => {
    h.markPayoutPaid.mockRejectedValue(new Error("Payout already recorded"));
    render(<PayoutsPanel data={data} />);
    openFor("Late Work");
    fireEvent.click(screen.getByRole("button", { name: "Confirm payout" }));
    expect(await screen.findByText("Payout already recorded")).toBeTruthy();
    expect(within(row("Late Work")).getAllByRole("cell")[4].textContent).toBe("Overdue");
    expect(screen.getByText(/Payout · Ben/)).toBeTruthy();
  });

  it("uses a generic message for non-Error failures", async () => {
    h.markPayoutPaid.mockRejectedValue("nope");
    render(<PayoutsPanel data={data} />);
    openFor("Late Work");
    fireEvent.click(screen.getByRole("button", { name: "Confirm payout" }));
    expect(await screen.findByText("Couldn't record that payout — try again.")).toBeTruthy();
  });
});
