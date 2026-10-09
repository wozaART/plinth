// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SiteFooter from "./SiteFooter";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("renders the brand and the documentation link", () => {
    render(<SiteFooter />);
    expect(screen.getByText("Woza Art")).toBeDefined();
    expect(screen.getByRole("link", { name: "Documentation" }).getAttribute("href")).toBe("/docs");
  });
});
