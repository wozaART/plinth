// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RESEARCH_FORMS } from "@/lib/research-forms";

const h = vi.hoisted(() => ({ submitResearchResponse: vi.fn() }));
vi.mock("@/lib/supabase/research-actions", () => ({ submitResearchResponse: h.submitResearchResponse }));

import ResearchForm from "./ResearchForm";

const form = RESEARCH_FORMS[0];
const submit = () => screen.getByRole("button", { name: /Send answers|Sending/ }) as HTMLButtonElement;

beforeEach(() => { h.submitResearchResponse.mockReset(); });

describe("ResearchForm", () => {
  it("renders nothing for an unknown slug", () => {
    const { container } = render(<ResearchForm slug="nope" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the about, idea and design sections with the form intro", () => {
    render(<ResearchForm slug={form.slug} />);
    expect(screen.getByRole("heading", { name: "About you" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The idea" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Shaping it" })).toBeTruthy();
    expect(screen.getByText(form.intro)).toBeTruthy();
    expect(screen.getByLabelText(/Your name/)).toBeTruthy();
  });

  it("submits with the slug and the entered answers", async () => {
    h.submitResearchResponse.mockResolvedValue({ ok: true });
    render(<ResearchForm slug={form.slug} />);
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "Thandiwe Mokoena" } });
    fireEvent.submit(submit().closest("form")!);
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(h.submitResearchResponse).toHaveBeenCalledTimes(1);
    const [slug, fd] = h.submitResearchResponse.mock.calls[0] as [string, FormData];
    expect(slug).toBe(form.slug);
    expect(fd.get("respondent_name")).toBe("Thandiwe Mokoena");
    expect(screen.getByRole("heading").textContent).toBe("Thank you, Thandiwe.");
  });

  it("thanks anonymously when no name was typed", async () => {
    h.submitResearchResponse.mockResolvedValue({ ok: true });
    render(<ResearchForm slug={form.slug} />);
    fireEvent.submit(submit().closest("form")!);
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.getByRole("heading").textContent).toBe("Thank you.");
  });

  it("shows validation errors from the server", async () => {
    h.submitResearchResponse.mockResolvedValue({ ok: false, message: "Some answers need attention.", errors: { respondent_name: "Tell us your name." } });
    render(<ResearchForm slug={form.slug} />);
    fireEvent.submit(submit().closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toBe("Some answers need attention.");
    expect(screen.getByText("Tell us your name.")).toBeTruthy();
  });

  it("reports a network failure", async () => {
    h.submitResearchResponse.mockRejectedValue(new Error("offline"));
    render(<ResearchForm slug={form.slug} />);
    fireEvent.submit(submit().closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't reach the server/);
  });
});
