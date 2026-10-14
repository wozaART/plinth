import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  options: null as null | {
    cookies: {
      getAll: () => { name: string; value: string }[];
      setAll: (c: { name: string; value: string; options?: object }[]) => void;
    };
  },
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => {
    h.createServerClient(...args);
    h.options = args[2] as typeof h.options;
    return { auth: {} };
  },
}));

import { createClient } from "./middleware";

function req() {
  return new NextRequest("http://localhost:3000/dashboard", { headers: { cookie: "a=1; b=2" } });
}

beforeEach(() => {
  h.createServerClient.mockClear();
});

describe("middleware createClient", () => {
  it("builds a server client that reads the request's cookies", () => {
    createClient(req());
    expect(h.options!.cookies.getAll()).toEqual([
      { name: "a", value: "1" },
      { name: "b", value: "2" },
    ]);
  });

  it("returns a pass-through response that forwards the request headers", () => {
    const { supabaseResponse } = createClient(req());
    const res = supabaseResponse();
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("writes refreshed auth cookies to both the request and a rebuilt response", () => {
    const request = req();
    const { supabaseResponse } = createClient(request);
    const before = supabaseResponse();

    h.options!.cookies.setAll([{ name: "sb-token", value: "fresh", options: { path: "/", httpOnly: true } }]);

    expect(request.cookies.get("sb-token")?.value).toBe("fresh");
    const after = supabaseResponse();
    expect(after).not.toBe(before);
    expect(after.cookies.get("sb-token")).toMatchObject({ value: "fresh", path: "/", httpOnly: true });
  });
});
