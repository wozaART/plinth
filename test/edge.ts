// Harness for running Supabase edge function handlers under vitest. The
// functions target Deno, so the pieces they lean on (Deno.serve / Deno.env,
// the supabase-js client, fetch to Resend) are replaced with fakes.
import { vi } from "vitest";

export type Handler = (req: Request) => Promise<Response> | Response;

export const ENV: Record<string, string> = {
  SUPABASE_URL: "http://supabase.test",
  SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  RESEND_API_KEY: "resend-key",
  RESEND_FROM_EMAIL: "Gallery <noreply@gallery.test>",
};

// Imports a function's index.ts fresh (pass `() => import("./index.ts")` so the
// path resolves relative to the test) and returns the handler it passed to
// Deno.serve.
export async function loadHandler(load: () => Promise<unknown>): Promise<Handler> {
  let handler: Handler | undefined;
  vi.resetModules();
  vi.stubGlobal("Deno", {
    env: { get: (key: string) => ENV[key] },
    serve: (h: Handler) => {
      handler = h;
    },
  });
  await load();
  if (!handler) throw new Error("module never called Deno.serve");
  return handler;
}

export interface FakeDb {
  /** Result of `auth.getUser()` for the caller's JWT. */
  user: { id: string } | null;
  /** Per-table query result, returned by single()/maybeSingle(). */
  tables: Record<string, { data: unknown; error?: unknown }>;
  /** Result of the service-role `auth.admin.getUserById()`. */
  adminUser: { data: { user: { email?: string | null } | null }; error: unknown };
}

// A chainable stand-in for a PostgREST query builder: every filter method
// returns the builder, and single()/maybeSingle() resolve to the table's
// canned result.
function queryBuilder(result: { data: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) builder[method] = () => builder;
  for (const method of ["single", "maybeSingle"]) {
    builder[method] = () => Promise.resolve({ data: result.data, error: result.error ?? null });
  }
  return builder;
}

export function fakeSupabase(db: FakeDb) {
  const userClient = {
    auth: { getUser: () => Promise.resolve({ data: { user: db.user } }) },
    from: vi.fn((table: string) => queryBuilder(db.tables[table] ?? { data: null })),
  };
  const adminClient = {
    auth: { admin: { getUserById: vi.fn(() => Promise.resolve(db.adminUser)) } },
  };
  const createClient = vi.fn((_url: string, key: string) =>
    key === ENV.SUPABASE_SERVICE_ROLE_KEY ? adminClient : userClient,
  );
  return { createClient, userClient, adminClient };
}

// Stubs the global fetch used to reach Resend and returns the spy.
export function stubResend(response: Response = new Response("{}", { status: 200 })) {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function sentEmail(fetchMock: ReturnType<typeof stubResend>) {
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) };
}

export function request(body: unknown, headers: Record<string, string> = { Authorization: "Bearer jwt" }) {
  return new Request("http://fn.test", { method: "POST", headers, body: JSON.stringify(body) });
}
