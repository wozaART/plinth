import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ARTWORK_GRADIENTS, AVATAR_COLORS } from "./constants";
import { artworkBg, avatarBg, initials, relativeTime, shortDate } from "./utils";

describe("artworkBg / avatarBg", () => {
  it("cycles through the palette", () => {
    expect(artworkBg(0)).toBe(ARTWORK_GRADIENTS[0]);
    expect(artworkBg(ARTWORK_GRADIENTS.length)).toBe(ARTWORK_GRADIENTS[0]);
    expect(artworkBg(ARTWORK_GRADIENTS.length + 2)).toBe(ARTWORK_GRADIENTS[2]);
  });

  it("builds an avatar gradient from the indexed colour", () => {
    expect(avatarBg(1)).toContain(AVATAR_COLORS[1]);
    expect(avatarBg(AVATAR_COLORS.length + 1)).toBe(avatarBg(1));
  });
});

describe("initials", () => {
  it("uses the first letters of the first two words, uppercased", () => {
    expect(initials("jane doe")).toBe("JD");
    expect(initials("Mary Jane Watson")).toBe("MJ");
  });

  it("handles a single name", () => {
    expect(initials("Cher")).toBe("C");
  });
});

describe("relativeTime", () => {
  const now = new Date(2026, 9, 15, 12, 0, 0); // local time, 15 Oct 2026

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => vi.useRealTimers());

  const daysAgo = (n: number) => new Date(2026, 9, 15 - n, 12, 0, 0).toISOString();

  it("says Today for the same calendar day", () => {
    expect(relativeTime(new Date(2026, 9, 15, 1, 0, 0).toISOString())).toBe("Today");
  });

  it("says Yesterday for the previous day", () => {
    expect(relativeTime(daysAgo(1))).toBe("Yesterday");
  });

  it("counts days within the last week", () => {
    expect(relativeTime(daysAgo(3))).toBe("3 days ago");
  });

  it("counts weeks, pluralised, up to a month", () => {
    expect(relativeTime(daysAgo(7))).toBe("1 week ago");
    expect(relativeTime(daysAgo(21))).toBe("3 weeks ago");
  });

  it("falls back to a formatted date after ~5 weeks", () => {
    const out = relativeTime(daysAgo(60));
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/Aug/);
  });

  it("treats future dates as today-ish without going negative", () => {
    expect(relativeTime(daysAgo(-3))).not.toMatch(/-/);
  });
});

describe("shortDate", () => {
  it("formats day and short month", () => {
    expect(shortDate(new Date(2026, 2, 5, 12).toISOString())).toMatch(/5\s+Mar/);
  });
});
