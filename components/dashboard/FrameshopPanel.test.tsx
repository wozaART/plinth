// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { FrameJob } from "@/lib/types";
import FrameshopPanel from "./FrameshopPanel";

const job = (over: Partial<FrameJob> = {}): FrameJob => ({ title: "Harbour at Dusk", artist: "Ana Artist", spec: "Oak, 5 cm, white mount", stage: "queued", due: "12 Jun", ...over });

describe("FrameshopPanel", () => {
  it("shows the column headers and an empty queue", () => {
    render(<FrameshopPanel data={[]} />);
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Work", "Frame spec", "Stage", "Due by"]);
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("shows each job's work, artist, spec and due date", () => {
    render(<FrameshopPanel data={[job()]} />);
    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
    expect(cells[0].textContent).toContain("Harbour at Dusk");
    expect(cells[0].textContent).toContain("Ana Artist");
    expect(cells[1].textContent).toBe("Oak, 5 cm, white mount");
    expect(cells[3].textContent).toBe("12 Jun");
  });

  it("labels each stage", () => {
    render(<FrameshopPanel data={[job(), job({ title: "B", stage: "building" }), job({ title: "C", stage: "ready" })]} />);
    expect(screen.getByText("Awaiting framing")).toBeTruthy();
    expect(screen.getByText("In the frameshop")).toBeTruthy();
    expect(screen.getByText("Framed & ready")).toBeTruthy();
  });

  it("keeps jobs with the same title apart", () => {
    render(<FrameshopPanel data={[job(), job()]} />);
    expect(screen.getAllByText("Harbour at Dusk")).toHaveLength(2);
  });
});
