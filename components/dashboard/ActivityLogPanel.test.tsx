// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AuditLogEntry } from "@/lib/types";
import ActivityLogPanel from "./ActivityLogPanel";

const entry = (over: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: "a1", entity: "exhibitions", action: "update", recordId: "r1", label: "Highveld Light", actorEmail: "curator@woza.art",
  when: "Today 10:00", whenRaw: "2026-01-01T10:00:00Z", changes: [{ field: "title", from: "Old", to: "New" }], ...over,
});

const data = [
  entry(),
  entry({ id: "a2", entity: "contacts", action: "insert", label: "Ana Artist", changes: [{ field: "email", from: null, to: "ana@example.com" }] }),
  entry({ id: "a3", entity: "contacts", action: "delete", label: "Old Contact", changes: [{ field: "email", from: "old@example.com", to: null }] }),
];
const labels = () => ["Highveld Light", "Ana Artist", "Old Contact"].filter((l) => screen.queryByText(l));

describe("ActivityLogPanel", () => {
  it("explains when there is no activity", () => {
    render(<ActivityLogPanel data={[]} />);
    expect(screen.getByText("No activity recorded yet.")).toBeTruthy();
  });

  it("lists each entry with its action, entity, actor and time", () => {
    render(<ActivityLogPanel data={data} />);
    expect(labels()).toHaveLength(3);
    expect(screen.getByText("Edited")).toBeTruthy();
    expect(screen.getByText("Created")).toBeTruthy();
    expect(screen.getByText("Deleted")).toBeTruthy();
    expect(screen.getAllByText("curator@woza.art")).toHaveLength(3);
    expect(screen.getAllByText("Today 10:00")).toHaveLength(3);
  });

  it("offers a filter per entity present in the log", () => {
    render(<ActivityLogPanel data={data} />);
    expect(screen.getAllByRole("button").slice(0, 3).map((b) => b.textContent)).toEqual(["All", "exhibitions", "contacts"]);
    fireEvent.click(screen.getByRole("button", { name: "contacts" }));
    expect(labels()).toEqual(["Ana Artist", "Old Contact"]);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(labels()).toHaveLength(3);
  });

  it("keeps the empty message when a filtered view has no entries", () => {
    render(<ActivityLogPanel data={[]} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("expands an entry to show before and after for an edit, collapsing it again", () => {
    render(<ActivityLogPanel data={[entry()]} />);
    const row = screen.getByRole("button", { name: /Highveld Light/ });
    expect(row.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("title")).toBeNull();
    fireEvent.click(row);
    expect(row.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("title")).toBeTruthy();
    expect(screen.getByText("Old")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("→")).toBeTruthy();
    fireEvent.click(row);
    expect(screen.queryByText("title")).toBeNull();
  });

  it("shows only the new value for a creation and only the old value for a deletion", () => {
    render(<ActivityLogPanel data={data.slice(1)} />);
    fireEvent.click(screen.getByRole("button", { name: /Ana Artist/ }));
    expect(screen.getByText("ana@example.com")).toBeTruthy();
    expect(screen.queryByText("→")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Old Contact/ }));
    expect(screen.getByText("old@example.com")).toBeTruthy();
  });

  it("shows a dash for empty values", () => {
    render(<ActivityLogPanel data={[entry({ changes: [{ field: "theme", from: null, to: null }] })]} />);
    fireEvent.click(screen.getByRole("button", { name: /Highveld Light/ }));
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("says when an entry has no field-level changes", () => {
    render(<ActivityLogPanel data={[entry({ changes: [] })]} />);
    fireEvent.click(screen.getByRole("button", { name: /Highveld Light/ }));
    expect(screen.getByText(/No field-level changes were recorded/)).toBeTruthy();
  });

  it("opens one entry at a time", () => {
    render(<ActivityLogPanel data={[entry(), entry({ id: "a2", label: "Second", changes: [{ field: "blurb", from: "a", to: "b" }] })]} />);
    fireEvent.click(screen.getByRole("button", { name: /Highveld Light/ }));
    fireEvent.click(screen.getByRole("button", { name: /Second/ }));
    expect(screen.queryByText("title")).toBeNull();
    expect(screen.getByText("blurb")).toBeTruthy();
  });
});
