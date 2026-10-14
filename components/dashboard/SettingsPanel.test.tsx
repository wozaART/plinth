// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({ connectCustomDomain: vi.fn(), refreshDomainStatus: vi.fn(), disconnectCustomDomain: vi.fn() }));
vi.mock("@/lib/supabase/domain-actions", () => h);

import SettingsPanel from "./SettingsPanel";

beforeEach(() => {
  for (const fn of Object.values(h)) fn.mockReset();
  h.connectCustomDomain.mockResolvedValue([{ type: "CNAME", name: "gallery", value: "cname.vercel-dns.com" }]);
  h.refreshDomainStatus.mockResolvedValue(undefined);
  h.disconnectCustomDomain.mockResolvedValue(undefined);
});

const connect = (domain = "gallery.example.com") => {
  fireEvent.change(screen.getByPlaceholderText("gallery.example.com"), { target: { value: domain } });
  fireEvent.click(screen.getByRole("button", { name: "Connect" }));
};

describe("SettingsPanel with no domain", () => {
  it("asks for a domain and has nothing to check or remove", () => {
    render(<SettingsPanel customDomain={null} domainStatus="none" />);
    expect((screen.getByPlaceholderText("gallery.example.com") as HTMLInputElement).required).toBe(true);
    expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("sends the domain, then shows the DNS record to add and a pending status", async () => {
    render(<SettingsPanel customDomain={null} domainStatus="none" />);
    connect();
    await waitFor(() => expect(h.connectCustomDomain).toHaveBeenCalledTimes(1));
    expect((h.connectCustomDomain.mock.calls[0][0] as FormData).get("domain")).toBe("gallery.example.com");
    expect(await screen.findByText("Add this DNS record at your registrar")).toBeTruthy();
    expect(screen.getByText("cname.vercel-dns.com")).toBeTruthy();
    expect(screen.getByText("CNAME")).toBeTruthy();
  });

  it("shows an error from the server and stays on the form", async () => {
    h.connectCustomDomain.mockRejectedValue(new Error("Domain already in use"));
    render(<SettingsPanel customDomain={null} domainStatus="none" />);
    connect();
    expect(await screen.findByText("Domain already in use")).toBeTruthy();
    expect(screen.getByPlaceholderText("gallery.example.com")).toBeTruthy();
  });

  it("uses a generic message for non-Error failures", async () => {
    h.connectCustomDomain.mockRejectedValue("x");
    render(<SettingsPanel customDomain={null} domainStatus="none" />);
    connect();
    expect(await screen.findByText("Couldn't connect that domain.")).toBeTruthy();
  });
});

describe("SettingsPanel with a domain", () => {
  it.each([
    ["verified", "Connected"],
    ["pending", "Pending verification"],
    ["error", "Error"],
    ["none", "Not connected"],
    ["weird", "weird"],
  ])("labels status %s as %s", (status, label) => {
    render(<SettingsPanel customDomain="art.example.com" domainStatus={status} />);
    expect(screen.getByText("art.example.com")).toBeTruthy();
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.queryByPlaceholderText("gallery.example.com")).toBeNull();
  });

  it("checks status and reloads the page to pick it up", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(<SettingsPanel customDomain="art.example.com" domainStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Check status" }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(h.refreshDomainStatus).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows an error when the status check fails", async () => {
    h.refreshDomainStatus.mockRejectedValue(new Error("Vercel unreachable"));
    render(<SettingsPanel customDomain="art.example.com" domainStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Check status" }));
    expect(await screen.findByText("Vercel unreachable")).toBeTruthy();
  });

  it("uses a generic message when the status check fails oddly", async () => {
    h.refreshDomainStatus.mockRejectedValue("x");
    render(<SettingsPanel customDomain="art.example.com" domainStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Check status" }));
    expect(await screen.findByText("Couldn't check domain status.")).toBeTruthy();
  });

  it("removes the domain and goes back to the connect form", async () => {
    render(<SettingsPanel customDomain="art.example.com" domainStatus="verified" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByPlaceholderText("gallery.example.com")).toBeTruthy();
    expect(screen.queryByText("art.example.com")).toBeNull();
    expect(h.disconnectCustomDomain).toHaveBeenCalled();
  });

  it("keeps the domain and shows an error if removal fails", async () => {
    h.disconnectCustomDomain.mockRejectedValue(new Error("Still attached"));
    render(<SettingsPanel customDomain="art.example.com" domainStatus="verified" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("Still attached")).toBeTruthy();
    expect(screen.getByText("art.example.com")).toBeTruthy();
  });

  it("uses a generic message when removal fails oddly", async () => {
    h.disconnectCustomDomain.mockRejectedValue("x");
    render(<SettingsPanel customDomain="art.example.com" domainStatus="verified" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("Couldn't remove that domain.")).toBeTruthy();
  });
});
