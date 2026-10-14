// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const submit = vi.fn();
let offline = false;
vi.mock("@/lib/supabase/consignment-terms-actions", () => ({ submitConsignmentTerms: (fd: FormData) => (offline ? Promise.reject(new Error("offline")) : submit(fd)) }));

import ConsignmentTermsForm from "./ConsignmentTermsForm";

beforeEach(() => {
  submit.mockReset();
  offline = false;
});

// Required fields would stop jsdom submitting on click, so submit the form directly (the server validates).
const send = () => fireEvent.submit(screen.getByRole("button", { name: "Send answers" }).closest("form")!);

describe("ConsignmentTermsForm", () => {
  it("renders every section and starts from the initial answers", () => {
    render(<ConsignmentTermsForm initial={{ gallery_name: "Vorster" }} />);
    expect(screen.getByRole("heading", { name: "About you" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Commission" })).toBeTruthy();
    expect((screen.getByLabelText(/Gallery name/) as HTMLInputElement).value).toBe("Vorster");
    expect(screen.getByRole("button", { name: "Send answers" })).toBeTruthy();
  });

  it("marks optional questions", () => {
    render(<ConsignmentTermsForm initial={{}} />);
    expect(screen.getByText("Your role", { exact: false }).textContent).toContain("(optional)");
    expect(screen.getByText("Gallery name").textContent).not.toContain("(optional)");
  });

  it("keeps typed answers and sends them with the empty honeypot", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ConsignmentTermsForm initial={{}} />);
    fireEvent.change(screen.getByLabelText(/Gallery name/), { target: { value: "Vorster" } });
    expect((screen.getByLabelText(/Gallery name/) as HTMLInputElement).value).toBe("Vorster");
    send();
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const fd = submit.mock.calls[0][0] as FormData;
    expect(fd.get("gallery_name")).toBe("Vorster");
    expect(fd.get("website")).toBe("");
  });

  it("includes a filled honeypot so the server can drop the submission", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ConsignmentTermsForm initial={{}} />);
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot.tabIndex).toBe(-1);
    fireEvent.change(honeypot, { target: { value: "spam.example" } });
    send();
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect((submit.mock.calls[0][0] as FormData).get("website")).toBe("spam.example");
  });

  it("shows pending state while the action runs", async () => {
    let resolve!: (v: unknown) => void;
    submit.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ConsignmentTermsForm initial={{}} />);
    send();
    const btn = (await screen.findByRole("button", { name: "Sending…" })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    resolve({ ok: true });
    await screen.findByRole("status");
  });

  it("shows per-field errors and the overall message, keeping answers", async () => {
    submit.mockResolvedValue({ ok: false, message: "A few answers need another look.", errors: { gallery_name: "Please answer this." } });
    render(<ConsignmentTermsForm initial={{ contact_name: "Cora" }} />);
    send();
    expect((await screen.findByRole("alert")).textContent).toBe("A few answers need another look.");
    expect(screen.getByText("Please answer this.")).toBeTruthy();
    const input = screen.getByLabelText(/Gallery name/);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("gallery_name-error");
    expect((screen.getByLabelText(/Your name/) as HTMLInputElement).value).toBe("Cora");
    expect(await screen.findByRole("button", { name: "Send answers" })).toBeTruthy();
  });

  it("falls back to a connection message when the action throws", async () => {
    offline = true;
    render(<ConsignmentTermsForm initial={{}} />);
    send();
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't reach the server/);
  });

  it("replaces the form with a thank-you addressed to the contact's first name", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ConsignmentTermsForm initial={{ contact_name: "Cora Lee" }} />);
    send();
    expect((await screen.findByRole("status")).textContent).toContain("Thank you, Cora.");
    expect(screen.queryByRole("button", { name: "Send answers" })).toBeNull();
  });

  it("thanks without a name when none was given", async () => {
    submit.mockResolvedValue({ ok: true });
    render(<ConsignmentTermsForm initial={{}} />);
    send();
    expect((await screen.findByRole("status")).textContent).toContain("Thank you.");
  });
});
