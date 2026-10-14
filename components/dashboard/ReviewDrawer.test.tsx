// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ReviewDrawer from "./ReviewDrawer";
import { submission } from "@/test/fixtures";
import type { Submission } from "@/lib/types";

function setup(sub: Submission = submission(), extra: { inCatalogue?: boolean; accepting?: boolean } = {}) {
  const onDecide = vi.fn();
  const onClose = vi.fn();
  const onAccept = vi.fn();
  render(
    <ReviewDrawer
      sub={sub}
      artworkIdx={0}
      onClose={onClose}
      onDecide={onDecide}
      inCatalogue={extra.inCatalogue ?? false}
      accepting={extra.accepting ?? false}
      onAcceptIntoCatalogue={onAccept}
    />,
  );
  return { onDecide, onClose, onAccept };
}

const btn = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const note = () => screen.getByPlaceholderText(/kind, honest response/) as HTMLTextAreaElement;
const decide = () => fireEvent.click(btn("Make a decision"));

describe("ReviewDrawer details", () => {
  it("shows the work, the artist and the submission details", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Salt Pan" })).toBeTruthy();
    expect(screen.getByText("AA")).toBeTruthy();
    for (const text of ["Oil on canvas", "90 × 120 cm", "R 24 000", "Open Call", "2025", "A study of light.", "Pending review"]) {
      expect(screen.getByText(text), text).toBeTruthy();
    }
  });

  it("shows a gallery note only when there is one", () => {
    setup(submission({ status: "declined", note: "Not a fit", ack: true }));
    expect(screen.getByText("Gallery note")).toBeTruthy();
    expect(screen.getByText("Not a fit")).toBeTruthy();
  });

  it("only makes the artwork zoomable when there is an image", () => {
    setup(submission({ imageUrl: "https://cdn.test/a.jpg" }));
    fireEvent.click(btn("View full size"));
    expect(screen.getByRole("dialog", { name: "Salt Pan" })).toBeTruthy();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no zoom control without an image", () => {
    setup();
    expect(screen.queryByRole("button", { name: "View full size" })).toBeNull();
  });

  it("closes from × and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(btn("×"));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("ReviewDrawer decisions (pending)", () => {
  it("starts with just a 'Make a decision' button", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    decide();
    expect(btn("Approve")).toBeTruthy();
  });

  it("approves without needing a note", () => {
    const { onDecide } = setup();
    decide();
    fireEvent.click(btn("Approve"));
    expect(onDecide).toHaveBeenCalledWith("sub1", "approved", "");
  });

  it("blocks decline and changes until a note is written", () => {
    const { onDecide } = setup();
    decide();
    for (const name of ["Request changes", "Decline"]) {
      expect(btn(name).disabled, name).toBe(true);
      expect(btn(name).title).toBe("Add a note to the artist first");
    }
    fireEvent.click(btn("Decline"));
    expect(onDecide).not.toHaveBeenCalled();

    fireEvent.change(note(), { target: { value: "   " } });
    expect(btn("Decline").disabled).toBe(true);
  });

  it("declines and requests changes with the trimmed note", () => {
    const { onDecide } = setup();
    decide();
    fireEvent.change(note(), { target: { value: "  Please resubmit  " } });
    expect(btn("Decline").disabled).toBe(false);
    expect(btn("Decline").title).toBe("");
    fireEvent.click(btn("Decline"));
    fireEvent.click(btn("Request changes"));
    expect(onDecide).toHaveBeenNthCalledWith(1, "sub1", "declined", "Please resubmit");
    expect(onDecide).toHaveBeenNthCalledWith(2, "sub1", "changes", "Please resubmit");
  });

  it("starts from the existing note", () => {
    setup(submission({ note: "Earlier note" }));
    decide();
    expect(note().value).toBe("Earlier note");
    expect(btn("Decline").disabled).toBe(false);
  });

  it("offers no decision controls once a decision has been made", () => {
    setup(submission({ status: "declined", ack: true }));
    expect(screen.queryByRole("button", { name: "Make a decision" })).toBeNull();
  });
});

describe("ReviewDrawer after approval", () => {
  it("offers to accept an approved work into the catalogue", () => {
    const { onAccept } = setup(submission({ status: "approved" }));
    fireEvent.click(btn("Accept into catalogue"));
    expect(onAccept).toHaveBeenCalledWith("sub1");
  });

  it("disables the button once the work is in the catalogue", () => {
    const { onAccept } = setup(submission({ status: "approved" }), { inCatalogue: true });
    expect(btn("In the catalogue").disabled).toBe(true);
    fireEvent.click(btn("In the catalogue"));
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("shows progress while adding", () => {
    setup(submission({ status: "approved" }), { accepting: true });
    expect(btn("Adding…").disabled).toBe(true);
  });

  it("doesn't offer the catalogue for pending or declined works", () => {
    setup();
    expect(screen.queryByRole("button", { name: /catalogue/i })).toBeNull();
  });
});

describe("ReviewDrawer acknowledgement warning", () => {
  it("warns when a declined work hasn't been acknowledged", () => {
    setup(submission({ status: "declined", ack: false }));
    expect(screen.getByText("Awaiting acknowledgement")).toBeTruthy();
  });

  it.each([true, undefined])("doesn't warn when ack is %s", (ack) => {
    setup(submission({ status: "declined", ack }));
    expect(screen.queryByText("Awaiting acknowledgement")).toBeNull();
  });
});
