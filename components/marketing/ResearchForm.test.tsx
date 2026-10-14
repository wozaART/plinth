// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RESEARCH_FORMS } from "@/lib/research-forms";

const submit = vi.fn();
let offline = false;
vi.mock("@/lib/supabase/research-actions", () => ({ submitResearchResponse: (slug: string, fd: FormData) => (offline ? Promise.reject(new Error("offline")) : submit(slug, fd)) }));

import ResearchForm from "./ResearchForm";

const form = RESEARCH_FORMS[0];

beforeEach(() => {
  submit.mockReset();
  offline = false;
});

// Required fields would stop jsdom submitting on click, so submit the form directly (the server validates).
const send = () => fireEvent.submit(screen.getByRole("button", { name: "Send answers" }).closest("form")!);

describe("ResearchForm", () => {
  it("renders nothing for an unknown slug", () => {
    const { container } = render(<ResearchForm slug="nope" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the about, idea (with intro) and design sections", () => {
    render(<ResearchForm slug={form.slug} />);
    expect(screen.getByRole("heading", { name: "About you" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The idea" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Shaping it" })).toBeTruthy();
    expect(screen.getByText(form.intro)).toBeTruthy();
    expect(screen.getByLabelText(/Your name/)).toBeTruthy();
  });

  it("submits to the action with the slug, the answers and an empty honeypot", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ResearchForm slug={form.slug} />);
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "Cora Lee" } });
    send();
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const [slug, fd] = submit.mock.calls[0] as [string, FormData];
    expect(slug).toBe(form.slug);
    expect(fd.get("respondent_name")).toBe("Cora Lee");
    expect(fd.get("website")).toBe("");
  });

  it("hides the honeypot from people and assistive tech", () => {
    render(<ResearchForm slug={form.slug} />);
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot.tabIndex).toBe(-1);
    expect(honeypot.autocomplete).toBe("off");
  });

  it("disables the button while sending", async () => {
    let resolve!: (v: unknown) => void;
    submit.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ResearchForm slug={form.slug} />);
    send();
    expect(((await screen.findByRole("button", { name: "Sending…" })) as HTMLButtonElement).disabled).toBe(true);
    resolve({ ok: true });
    await screen.findByRole("status");
  });

  it("shows field errors and the overall message, keeping what was typed", async () => {
    submit.mockResolvedValue({ ok: false, message: "A few answers need another look.", errors: { respondent_email: "Enter a valid email." } });
    render(<ResearchForm slug={form.slug} />);
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "Cora" } });
    send();
    expect((await screen.findByRole("alert")).textContent).toBe("A few answers need another look.");
    expect(screen.getByText("Enter a valid email.")).toBeTruthy();
    expect((screen.getByLabelText(/Your name/) as HTMLInputElement).value).toBe("Cora");
  });

  it("shows a connection message if the action throws", async () => {
    offline = true;
    render(<ResearchForm slug={form.slug} />);
    send();
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't reach the server/);
  });

  it("thanks the respondent by first name on success", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ResearchForm slug={form.slug} />);
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "  Cora Lee" } });
    send();
    expect((await screen.findByRole("status")).textContent).toContain("Thank you, Cora.");
    expect(screen.queryByRole("button", { name: "Send answers" })).toBeNull();
  });

  it("thanks anonymously when no name was typed", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ResearchForm slug={form.slug} />);
    send();
    expect((await screen.findByRole("status")).textContent).toContain("Thank you.");
  });
});
