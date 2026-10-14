// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const rpc = vi.fn();
  const profileQuery = { select: () => profileQuery, eq: () => profileQuery, maybeSingle: async () => ({ data: { id: "u1" } }) };
  return {
    push: vi.fn(),
    maybeSingle,
    rpc,
    supabase: {
      rpc,
      auth: {
        signInWithPassword: vi.fn(),
        getUser: vi.fn(),
        signInWithOAuth: vi.fn(),
      },
      from: () => profileQuery,
    },
    search: new URLSearchParams(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, refresh: vi.fn() }),
  useSearchParams: () => h.search,
}));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => h.supabase }));

import SignInPage from "./page";

const TOKEN = "87d57d8f-4c03-4c21-83ce-7ccb422f73a2";

function mockInvite(status: string) {
  h.rpc.mockImplementation((fn: string) => {
    if (fn === "get_artist_invite") {
      return {
        maybeSingle: async () => ({
          data: {
            email: "artist@example.com", full_name: "A", gallery_name: "Gallery", status,
            expires_at: new Date(Date.now() + 86_400_000).toISOString(),
          },
        }),
      };
    }
    // accept_artist_invite
    return Promise.resolve({ error: { message: "This invite is accepted and can no longer be accepted." } });
  });
}

async function signInWithPassword() {
  fireEvent.change(await screen.findByPlaceholderText("you@email.com"), { target: { value: "artist@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("artist sign-in with an ?invite= token in the URL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.search = new URLSearchParams({ invite: TOKEN });
    h.supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", user_metadata: {} } }, error: null });
    h.supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("signs in without re-accepting an invite that was already accepted", async () => {
    mockInvite("accepted");
    render(<SignInPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Sign in" }));
    await signInWithPassword();

    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/studio"));
    expect(h.rpc).not.toHaveBeenCalledWith("accept_artist_invite", expect.anything());
    expect(screen.queryByText(/can no longer be accepted/)).toBeNull();
  });

  it("does not forward a spent token through Google sign-in", async () => {
    mockInvite("revoked");
    render(<SignInPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Back to sign in" }));
    fireEvent.click(await screen.findByRole("button", { name: /Google/ }));

    const { options } = h.supabase.auth.signInWithOAuth.mock.calls[0][0];
    expect(options.redirectTo).not.toContain("invite=");
  });

  it("still redeems an invite that is ready", async () => {
    h.rpc.mockImplementation((fn: string) =>
      fn === "get_artist_invite"
        ? { maybeSingle: async () => ({ data: { email: "artist@example.com", full_name: "A", gallery_name: "G", status: "pending", expires_at: new Date(Date.now() + 86_400_000).toISOString() } }) }
        : Promise.resolve({ error: null }),
    );
    render(<SignInPage />);

    // Ready invite opens on the accept form; switch to the sign-in view.
    fireEvent.click(await screen.findByRole("button", { name: /sign in/i }));
    await signInWithPassword();

    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith("accept_artist_invite", { p_token: TOKEN }));
  });
});
