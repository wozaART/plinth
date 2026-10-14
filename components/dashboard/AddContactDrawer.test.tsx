// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AddContactDrawer from "./AddContactDrawer";

const type = (label: RegExp, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

function setup(existingEmails: string[] = []) {
  const onCreate = vi.fn();
  const onClose = vi.fn();
  render(<AddContactDrawer onClose={onClose} onCreate={onCreate} existingEmails={existingEmails} />);
  const submit = () => screen.getByRole("button", { name: /Add contact|Add & send invitation/ }) as HTMLButtonElement;
  const inviteToggle = () => screen.getByText("Send artist portal invitation").parentElement!.parentElement!.querySelector("button")!;
  return { onCreate, onClose, submit, inviteToggle };
}

describe("AddContactDrawer", () => {
  it("defaults to an artist with an invitation", () => {
    const { submit } = setup();
    expect(submit().textContent).toBe("Add & send invitation");
    expect(screen.getByText("Send artist portal invitation")).toBeTruthy();
  });

  it("needs both a name and an email", () => {
    const { submit } = setup();
    expect(submit().disabled).toBe(true);
    type(/Full name/, "Ana");
    expect(submit().disabled).toBe(true);
    type(/Email/, "ana@example.com");
    expect(submit().disabled).toBe(false);
    type(/Full name/, "   ");
    expect(submit().disabled).toBe(true);
  });

  it("creates an artist and sends the invitation, with trimmed values", () => {
    const { submit, onCreate } = setup();
    type(/Full name/, " Ana Artist ");
    type(/Email/, " ana@example.com ");
    type(/Focus/, " Painting ");
    fireEvent.click(submit());
    expect(onCreate).toHaveBeenCalledWith({ name: "Ana Artist", email: "ana@example.com", role: "Artist", focus: "Painting" }, true);
  });

  it("creates an artist without an invitation when the toggle is switched off", () => {
    const { submit, inviteToggle, onCreate } = setup();
    fireEvent.click(inviteToggle());
    expect(submit().textContent).toBe("Add contact");
    type(/Full name/, "Ana");
    type(/Email/, "ana@example.com");
    fireEvent.click(submit());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ role: "Artist" }), false);
  });

  it("never invites collectors, and hides the invitation option", () => {
    const { submit, onCreate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Collector" }));
    expect(screen.queryByText("Send artist portal invitation")).toBeNull();
    expect(submit().textContent).toBe("Add contact");
    type(/Full name/, "Cora");
    type(/Email/, "cora@example.com");
    fireEvent.click(submit());
    expect(onCreate).toHaveBeenCalledWith({ name: "Cora", email: "cora@example.com", role: "Collector", focus: "" }, false);
  });

  it("changes the focus placeholder with the contact type", () => {
    setup();
    expect((screen.getByLabelText(/Focus/) as HTMLInputElement).placeholder).toMatch(/Landscape painting/);
    fireEvent.click(screen.getByRole("button", { name: "Collector" }));
    expect((screen.getByLabelText(/Focus/) as HTMLInputElement).placeholder).toMatch(/Contemporary SA/);
  });

  it("blocks an email that already exists, ignoring case and spaces", () => {
    const { submit, onCreate } = setup(["ana@example.com"]);
    type(/Full name/, "Ana");
    type(/Email/, "  ANA@Example.com ");
    expect(screen.getByText("A contact with this email already exists.")).toBeTruthy();
    expect(submit().disabled).toBe(true);
    fireEvent.click(submit());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("closes from ×, Cancel and the scrim", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(document.querySelector(".anim-scrim > div")!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
