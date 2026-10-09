import { describe, expect, it } from "vitest";
import { PLATFORM_ADMIN_EMAIL } from "./platform-admin";

describe("PLATFORM_ADMIN_EMAIL", () => {
  it("is a lowercase, well-formed address", () => {
    expect(PLATFORM_ADMIN_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(PLATFORM_ADMIN_EMAIL).toBe(PLATFORM_ADMIN_EMAIL.toLowerCase());
  });
});
