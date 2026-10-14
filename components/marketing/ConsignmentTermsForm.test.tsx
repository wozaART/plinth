// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({ submitConsignmentTerms: vi.fn() }));
vi.mock("@/lib/supabase/consignment-terms-actions", () => h);

import ConsignmentTermsForm from "./ConsignmentTermsForm";

const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const submit = () => screen.getByRole("button", { name: /Send answers|Sending/ }) as HTMLButtonElement;

beforeEach(() => { h.submitConsignmentTerms.mockReset(); });

describe("ConsignmentTermsForm", () => {
  it("renders the sections and marks optional questions", () => {
    render(<ConsignmentTermsForm initial={{}} />);
    expect(screen.getByRole("heading", { name: "About you" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Commission" })).toBeTruthy();
    expect(screen.getByLabelText(/Gallery name/)).toBeTruthy();
    expect(screen.getByText("Your role").textContent).toContain("(optional)");
  });

  it("prefills from initial values", () => {
    render(<ConsignmentTermsForm initial={{ gallery_name: "Vorster" }} />);
    expect((screen.getByLabelText(/Gallery name/) as HTMLInputElement).value).toBe("Vorster");
  });

  it("selects a radio option", () => {
    render(<ConsignmentTermsForm initial={{}} />);
    const yes = screen.getAllByRole("radio", { name: "Yes" })[0] as HTMLInputElement;
    expect(yes.checked).toBe(false);
    fireEvent.click(yes);
    expect(yes.checked).toBe(true);
  });

  it("submits the form data and shows a thank-you with the first name", async () => {
    h.submitConsignmentTerms.mockResolvedValue({ ok: true });
    render(<ConsignmentTermsForm initial={{}} />);
    type(/Gallery name/, "Vorster");
    type(/Your name/, "Naledi Marais");
    fireEvent.submit(submit().closest("form")!);
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.getByRole("heading").textContent).toBe("Thank you, Naledi.");
    const fd = h.submitConsignmentTerms.mock.calls[0][0] as FormData;
    expect(fd.get("gallery_name")).toBe("Vorster");
    expect(fd.get("contact_name")).toBe("Naledi Marais");
  });

  it("shows the server message and per-field errors", async () => {
    h.submitConsignmentTerms.mockResolvedValue({ ok: false, message: "Please fix the highlighted answers.", errors: { gallery_name: "Required." } });
    render(<ConsignmentTermsForm initial={{}} />);
    fireEvent.submit(submit().closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toBe("Please fix the highlighted answers.");
    expect(screen.getByText("Required.")).toBeTruthy();
    expect(screen.getByLabelText(/Gallery name/).getAttribute("aria-invalid")).toBe("true");
  });

  it("reports a network failure and re-enables the button", async () => {
    h.submitConsignmentTerms.mockRejectedValue(new Error("offline"));
    render(<ConsignmentTermsForm initial={{}} />);
    fireEvent.submit(submit().closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't reach the server/);
    await waitFor(() => expect(submit().disabled).toBe(false));
  });

  it("disables the button and shows progress while sending", async () => {
    let resolve!: (v: unknown) => void;
    h.submitConsignmentTerms.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<ConsignmentTermsForm initial={{}} />);
    fireEvent.submit(submit().closest("form")!);
    await waitFor(() => expect(submit().textContent).toBe("Sending…"));
    expect(submit().disabled).toBe(true);
    resolve({ ok: true });
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
  });
});
