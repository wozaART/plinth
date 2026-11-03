import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  revalidatePath: vi.fn(),
  gallery: { id: "gal-1", theme_mode: "light", theme_colors: { accent: "#000000", bgApp: "#FFFFFF" } },
}));

vi.mock("next/headers", () => ({ cookies: async () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: h.revalidatePath }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));
vi.mock("@/lib/supabase/gallery", () => ({ getCurrentGallery: async () => h.gallery }));

import { updateGalleryTheme } from "./theme-actions";

function form(accent: string, fontDisplay = "Cinzel", fontBody = "Poppins", ink = "#14213F", sidebar = "#EFEDE6") {
  const fd = new FormData();
  fd.set("accent", accent);
  fd.set("fontDisplay", fontDisplay);
  fd.set("fontBody", fontBody);
  fd.set("ink", ink);
  fd.set("sidebar", sidebar);
  return fd;
}

beforeEach(() => {
  h.fake = createFakeSupabase();
  h.revalidatePath.mockClear();
});

describe("updateGalleryTheme", () => {
  it.each([
    [form("red"), "isn't a valid colour"],
    [form("#B5623C", "Comic Sans"), "heading font"],
    [form("#B5623C", "Cinzel", "Papyrus"), "body font"],
    [form("#B5623C", "toString"), "heading font"],
    [form("#B5623C", "Cinzel", "Poppins", "#000000"), "ink and sidebar"],
  ])("rejects invalid input before touching the database", async (fd, message) => {
    await expect(updateGalleryTheme(fd)).rejects.toThrow(message);
    expect(h.fake.queries).toHaveLength(0);
  });

  it("merges the accent into the existing palette and saves fonts", async () => {
    await updateGalleryTheme(form("#22C39C"));
    const q = h.fake.last("galleries", "update");
    expect(q?.payload).toEqual({
      theme_colors: { accent: "#22C39C", accentHover: "#1DA685", onAccent: "#17150F", bgApp: "#FFFFFF", solid: "#14213F", surfaceDark: "#14213F", text: "#14213F", sidebar: "#EFEDE6" },
      font_display: { googleFont: "Cinzel", weights: ["500", "600", "700"] },
      font_body: { googleFont: "Poppins", weights: ["300", "400", "500", "600", "700"] },
    });
    expect(q?.filters).toEqual([["id", "gal-1"]]);
    expect(h.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("leaves ink and sidebar alone on dark galleries", async () => {
    h.gallery = { ...h.gallery, theme_mode: "dark" };
    await updateGalleryTheme(form("#22C39C", "Cinzel", "Poppins", "", ""));
    const colors = (h.fake.last("galleries", "update")?.payload as { theme_colors: Record<string, string> }).theme_colors;
    expect(colors).not.toHaveProperty("solid");
    expect(colors).not.toHaveProperty("sidebar");
    h.gallery = { ...h.gallery, theme_mode: "light" };
  });

  it("throws the database error without revalidating", async () => {
    const err = { message: "boom" };
    h.fake.on("galleries", "update", { data: null, error: err });
    await expect(updateGalleryTheme(form("#22C39C"))).rejects.toBe(err);
    expect(h.revalidatePath).not.toHaveBeenCalled();
  });
});
