import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";
import type { Database } from "./database.types";

const h = vi.hoisted(() => ({ headerValues: {} as Record<string, string> }));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => h.headerValues[k] ?? null }),
}));

import { getCurrentGallery } from "./gallery";

let fake: FakeSupabase;

// The shared fake has no maybeSingle(); it resolves like single() here.
function client(): SupabaseClient<Database> {
  const from = fake.client.from;
  return {
    ...fake.client,
    from: (table: string) => {
      const b = from(table) as Record<string, unknown>;
      b.maybeSingle = b.single;
      return b;
    },
  } as unknown as SupabaseClient<Database>;
}

const galleryFilter = (table = "galleries") => fake.queries.filter((q) => q.table === table).map((q) => q.filters);

beforeEach(() => {
  fake = createFakeSupabase();
  h.headerValues = {};
});

describe("getCurrentGallery", () => {
  it("loads the gallery named by the x-gallery-slug header", async () => {
    h.headerValues["x-gallery-slug"] = "sunset";
    fake.on("galleries", "select", { data: { id: "g-sunset", slug: "sunset" }, error: null });
    expect(await getCurrentGallery(client())).toEqual({ id: "g-sunset", slug: "sunset" });
    expect(galleryFilter()).toEqual([[["slug", "sunset"]]]);
  });

  it("does not look for an owned gallery on a non-default host, even when signed in", async () => {
    h.headerValues["x-gallery-slug"] = "sunset";
    fake.state.user = { id: "u1" };
    fake.on("galleries", "select", { data: { id: "g-sunset" }, error: null });
    await getCurrentGallery(client());
    expect(galleryFilter().flat()).not.toContainEqual(["owner_id", "u1"]);
  });

  it("falls back to the default slug when the header is absent", async () => {
    fake.on("galleries", "select", { data: { id: "g-default" }, error: null });
    await getCurrentGallery(client());
    expect(galleryFilter().at(-1)).toEqual([["slug", "default"]]);
  });

  it("returns the signed-in owner's own gallery on the default host", async () => {
    fake.state.user = { id: "u1" };
    fake.on("galleries", "select", { data: { id: "g-owned", owner_id: "u1" }, error: null });
    expect(await getCurrentGallery(client())).toEqual({ id: "g-owned", owner_id: "u1" });
    expect(galleryFilter()).toEqual([[["owner_id", "u1"]]]);
  });

  it("uses the default gallery for anonymous visitors on the default host", async () => {
    fake.on("galleries", "select", { data: { id: "g-default" }, error: null });
    await getCurrentGallery(client());
    expect(galleryFilter()).toEqual([[["slug", "default"]]]);
  });

  it("throws a descriptive error when the slug matches no gallery", async () => {
    h.headerValues["x-gallery-slug"] = "ghost";
    fake.on("galleries", "select", { data: null, error: { message: "no rows" } });
    await expect(getCurrentGallery(client())).rejects.toThrow('No gallery found for slug "ghost": no rows');
  });

  it("reports a missing row even without a database error", async () => {
    h.headerValues["x-gallery-slug"] = "ghost";
    await expect(getCurrentGallery(client())).rejects.toThrow('No gallery found for slug "ghost": no row');
  });
});
