import { describe, expect, it } from "vitest";
import { isDemoUser } from "./demo";

describe("isDemoUser", () => {
  it("matches seeded demo accounts", () => {
    expect(isDemoUser({ email: "owner@sable.demo.wozaart.test" })).toBe(true);
    expect(isDemoUser({ email: "Naledi@demo.wozaart.test" })).toBe(true);
  });

  it("rejects real, missing and look-alike accounts", () => {
    expect(isDemoUser({ email: "debruyn.sarel@gmail.com" })).toBe(false);
    expect(isDemoUser({ email: "x@notdemo.wozaart.test" })).toBe(false);
    expect(isDemoUser({ email: null })).toBe(false);
    expect(isDemoUser(null)).toBe(false);
  });
});
