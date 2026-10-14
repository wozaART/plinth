// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { contact } from "@/test/fixtures";

const h = vi.hoisted(() => ({ inviteArtist: vi.fn(), createContact: vi.fn(), deleteContact: vi.fn() }));
vi.mock("@/lib/supabase/actions", () => h);

import ContactsPanel from "./ContactsPanel";

const data = [
  contact({ id: "c1", name: "Ana Artist", email: "ana@example.com", role: "Artist", focus: "Painting" }),
  contact({ id: "c2", name: "Cora Collector", email: "cora@example.com", role: "Collector", focus: "Contemporary" }),
];
const setup = (d = data) => render(<ContactsPanel data={d} />);
const card = (name: string) => screen.getByText(name).closest("div[style*='border-radius: 12px']") as HTMLElement;
const names = () => ["Ana Artist", "Cora Collector"].filter((n) => screen.queryByText(n));

beforeEach(() => {
  for (const fn of Object.values(h)) fn.mockReset();
  h.inviteArtist.mockResolvedValue(undefined);
  h.createContact.mockResolvedValue({ id: "real-id", inviteError: null });
  h.deleteContact.mockResolvedValue(undefined);
});

describe("ContactsPanel list", () => {
  it("lists contacts and filters by role", () => {
    setup();
    expect(names()).toEqual(["Ana Artist", "Cora Collector"]);
    fireEvent.click(screen.getByRole("button", { name: "Artist" }));
    expect(names()).toEqual(["Ana Artist"]);
    fireEvent.click(screen.getByRole("button", { name: "Collector" }));
    expect(names()).toEqual(["Cora Collector"]);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(names()).toHaveLength(2);
  });

  it("only offers a portal invitation to artists", () => {
    setup();
    expect(within(card("Ana Artist")).getByRole("button", { name: "Invite to portal" })).toBeTruthy();
    expect(within(card("Cora Collector")).queryByRole("button", { name: "Invite to portal" })).toBeNull();
  });
});

describe("ContactsPanel invite", () => {
  it("invites an artist and shows it as invited", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Invite to portal" }));
    await waitFor(() => expect(h.inviteArtist).toHaveBeenCalledWith("ana@example.com", "Ana Artist"));
    expect(await screen.findByRole("button", { name: "Invited" })).toBeTruthy();
  });

  it("shows progress while sending", async () => {
    let resolve!: () => void;
    h.inviteArtist.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Invite to portal" }));
    expect(((await screen.findByRole("button", { name: "Sending…" })) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => resolve());
    expect(await screen.findByRole("button", { name: "Invited" })).toBeTruthy();
  });

  it("offers a retry when the invitation fails", async () => {
    h.inviteArtist.mockRejectedValueOnce(new Error("x"));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Invite to portal" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retry invite" }));
    expect(await screen.findByRole("button", { name: "Invited" })).toBeTruthy();
    expect(h.inviteArtist).toHaveBeenCalledTimes(2);
  });
});

describe("ContactsPanel adding", () => {
  function add(sendInvite = true) {
    fireEvent.click(screen.getByRole("button", { name: "+ Add contact" }));
    const drawer = within(document.querySelector(".anim-scrim") as HTMLElement);
    fireEvent.change(drawer.getByLabelText(/Full name/), { target: { value: "New Artist" } });
    fireEvent.change(drawer.getByLabelText(/Email/), { target: { value: "new@example.com" } });
    if (!sendInvite) fireEvent.click(drawer.getByRole("button", { name: "Collector" }));
    fireEvent.click(drawer.getByRole("button", { name: /^(Add contact|Add & send invitation)$/ }));
  }

  it("shows the contact immediately, toasts, closes the drawer and saves", async () => {
    setup();
    add();
    expect(screen.getByText("New Artist")).toBeTruthy();
    expect(screen.getByText("Portal invitation sent to New Artist")).toBeTruthy();
    expect(screen.queryByLabelText(/Full name/)).toBeNull();
    await waitFor(() => expect(h.createContact).toHaveBeenCalledWith({ name: "New Artist", email: "new@example.com", role: "Artist", focus: "", sendInvite: true }));
    expect(await screen.findByRole("button", { name: "Invited", hidden: false })).toBeTruthy();
  });

  it("toasts without an invitation for collectors", async () => {
    setup();
    add(false);
    expect(screen.getByText("New Artist added to contacts")).toBeTruthy();
    await waitFor(() => expect(h.createContact).toHaveBeenCalledWith(expect.objectContaining({ role: "Collector", sendInvite: false })));
  });

  it("warns when the contact saved but the invitation didn't send", async () => {
    h.createContact.mockResolvedValue({ id: "real-id", inviteError: "bounced" });
    setup();
    add();
    expect(await screen.findByText("New Artist added, but the invite couldn't be sent")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Retry invite" })).toHaveLength(1);
  });

  it("rolls the contact back and explains when saving fails", async () => {
    h.createContact.mockRejectedValue(new Error("Email already in use"));
    setup();
    add();
    expect(await screen.findByText("Email already in use")).toBeTruthy();
    expect(screen.queryByText("New Artist")).toBeNull();
  });

  it("uses a generic message for non-Error failures", async () => {
    h.createContact.mockRejectedValue("x");
    setup();
    add();
    expect(await screen.findByText("Couldn't add New Artist — try again")).toBeTruthy();
  });

  it("clears the toast after a few seconds", () => {
    vi.useFakeTimers();
    try {
      setup();
      add(false);
      expect(screen.getByText("New Artist added to contacts")).toBeTruthy();
      act(() => { vi.advanceTimersByTime(3900); });
      expect(screen.queryByText("New Artist added to contacts")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ContactsPanel removing", () => {
  const remove = (name: string) => within(card(name)).getByRole("button", { name: /Remove|Confirm\?|Retry remove|Removing…/ });

  it("asks for confirmation before removing", async () => {
    setup();
    fireEvent.click(remove("Ana Artist"));
    expect(h.deleteContact).not.toHaveBeenCalled();
    expect(remove("Ana Artist").textContent).toBe("Confirm?");
    expect(remove("Cora Collector").textContent).toBe("Remove");
    fireEvent.click(remove("Ana Artist"));
    await waitFor(() => expect(h.deleteContact).toHaveBeenCalledWith("c1"));
    await waitFor(() => expect(screen.queryByText("Ana Artist")).toBeNull());
    expect(screen.getByText("Cora Collector")).toBeTruthy();
  });

  it("offers a retry if removal fails, keeping the contact", async () => {
    h.deleteContact.mockRejectedValueOnce(new Error("x"));
    setup();
    fireEvent.click(remove("Ana Artist"));
    fireEvent.click(remove("Ana Artist"));
    expect(await within(card("Ana Artist")).findByRole("button", { name: "Retry remove" })).toBeTruthy();
    // Retrying goes back through the confirmation step.
    fireEvent.click(remove("Ana Artist"));
    expect(remove("Ana Artist").textContent).toBe("Confirm?");
    fireEvent.click(remove("Ana Artist"));
    await waitFor(() => expect(screen.queryByText("Ana Artist")).toBeNull());
  });
});
