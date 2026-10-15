// A minimal in-memory stand-in for the Supabase client: records every query
// built against it and resolves with whatever the test queued up, so server
// actions can be exercised without a database.

type Result = { data?: unknown; error?: unknown; count?: number | null };

export interface RecordedQuery {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete";
  payload?: unknown;
  filters: [string, unknown][];
  orderBy: [string, unknown][];
  limit?: number;
  selected?: string;
}

export function createFakeSupabase() {
  const queries: RecordedQuery[] = [];
  const results = new Map<string, Result>();
  const rpcCalls: { fn: string; args: unknown }[] = [];
  const rpcResults = new Map<string, Result>();
  const invocations: { fn: string; body: unknown }[] = [];
  const uploads: { bucket: string; path: string; file: unknown }[] = [];
  const signedUrls: { bucket: string; path: string; ttl: number }[] = [];
  const state = {
    signedUrlResult: { data: { signedUrl: "https://signed.test/x" }, error: null } as { data: { signedUrl: string } | null; error: unknown },
    user: null as null | { id: string; user_metadata?: Record<string, unknown> },
    invokeResult: { data: {}, error: null } as Result,
    uploadError: null as unknown,
  };

  function builder(table: string) {
    const q: RecordedQuery = { table, op: "select", filters: [], orderBy: [] };
    queries.push(q);
    const resolve = (): Result => results.get(`${table}:${q.op}`) ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const op of ["insert", "update", "upsert"] as const) {
      b[op] = (payload: unknown) => {
        q.op = op;
        q.payload = payload;
        return b;
      };
    }
    b.delete = () => {
      q.op = "delete";
      return b;
    };
    // select() after insert/update just asks for the row back; it must not
    // reset the operation.
    b.select = (cols?: string) => {
      if (q.op === "select") q.selected = cols;
      return b;
    };
    b.eq = (col: string, val: unknown) => {
      q.filters.push([col, val]);
      return b;
    };
    b.neq = (col: string, val: unknown) => {
      q.filters.push([`${col}!=`, val]);
      return b;
    };
    b.is = (col: string, val: unknown) => {
      q.filters.push([`${col} is`, val]);
      return b;
    };
    b.or = (expr: string) => {
      q.filters.push(["or", expr]);
      return b;
    };
    b.order = (col: string, opts?: unknown) => {
      q.orderBy.push([col, opts]);
      return b;
    };
    b.limit = (n: number) => {
      q.limit = n;
      return b;
    };
    b.single = () => Promise.resolve(resolve());
    b.maybeSingle = () => Promise.resolve(resolve());
    b.then = (onFulfilled: (r: Result) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected);
    return b;
  }

  const client = {
    from: builder,
    rpc: (fn: string, args: unknown) => {
      rpcCalls.push({ fn, args });
      return Promise.resolve(rpcResults.get(fn) ?? { data: null, error: null });
    },
    auth: { getUser: () => Promise.resolve({ data: { user: state.user } }) },
    functions: {
      invoke: (fn: string, opts: { body: unknown }) => {
        invocations.push({ fn, body: opts.body });
        return Promise.resolve(state.invokeResult);
      },
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: unknown) => {
          uploads.push({ bucket, path, file });
          return Promise.resolve({ error: state.uploadError });
        },
        createSignedUrl: (path: string, ttl: number) => {
          signedUrls.push({ bucket, path, ttl });
          return Promise.resolve(state.signedUrlResult);
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }),
      }),
    },
  };

  return {
    client,
    queries,
    rpcCalls,
    invocations,
    uploads,
    signedUrls,
    state,
    /** Queue the result for `table`'s next-and-subsequent `op` queries. */
    on(table: string, op: RecordedQuery["op"], result: Result) {
      results.set(`${table}:${op}`, result);
    },
    onRpc(fn: string, result: Result) {
      rpcResults.set(fn, result);
    },
    last(table: string, op?: RecordedQuery["op"]) {
      return [...queries].reverse().find((q) => q.table === table && (!op || q.op === op));
    },
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
