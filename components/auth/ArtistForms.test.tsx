// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ArtistExhibitionInvite, ArtistForgot, ArtistInvite, ArtistSignIn, type InviteStatus } from "./ArtistForms";

const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe("ArtistSignIn", () => {
  function setup(loading = false) {
    const p = { email: "", password: "", loading, onEmail: vi.fn(), onPassword: vi.fn(), onSubmit: vi.fn(), onForgot: vi.fn(), onInvite: vi.fn(), onOAuth: vi.fn(), onError: vi.fn() };
    render(<ArtistSignIn {...p} />);
    return p;
  }

  it("reports typing, clearing errors, and submits on Enter", () => {
    const p = setup();
    change(screen.getByPlaceholderText("you@email.com"), "t@m.co");
    change(screen.getByPlaceholderText("••••••••••"), "pw");
    expect(p.onEmail).toHaveBeenCalledWith("t@m.co");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onError).toHaveBeenCalledWith(null);
    fireEvent.keyDown(screen.getByPlaceholderText("••••••••••"), { key: "Enter" });
    expect(p.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("routes to forgot-password, Google and the invite flow", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    fireEvent.click(screen.getByRole("button", { name: /Accept it/ }));
    expect(p.onForgot).toHaveBeenCalled();
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    expect(p.onInvite).toHaveBeenCalled();
  });

  it("disables sign in while loading", () => {
    setup(true);
    expect((screen.getByRole("button", { name: "Signing in…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ArtistForgot", () => {
  const base = { email: "", sent: false, loading: false, onEmail: vi.fn(), onSubmit: vi.fn(), onBack: vi.fn(), onError: vi.fn() };

  it("requests a reset link", () => {
    const onSubmit = vi.fn();
    render(<ArtistForgot {...base} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("confirms once sent", () => {
    render(<ArtistForgot {...base} sent />);
    expect(screen.getByRole("heading", { name: "Reset link sent." })).toBeTruthy();
  });
});

function inviteProps(over: Partial<React.ComponentProps<typeof ArtistInvite>> = {}) {
  return {
    status: "ready" as InviteStatus, galleryName: "Vorster Gallery", email: "t@m.co", name: "", practice: "", city: "", password: "",
    agreed: false, confirmationPending: false, loading: false,
    onName: vi.fn(), onPractice: vi.fn(), onCity: vi.fn(), onPassword: vi.fn(), onAgreed: vi.fn(),
    onSubmit: vi.fn(), onOAuth: vi.fn(), onSignIn: vi.fn(), onError: vi.fn(),
    ...over,
  };
}

describe("ArtistInvite", () => {
  it.each([
    ["loading", "Checking your invite…", null],
    ["no_token", "Open the link from your gallery.", "Back to sign in"],
    ["not_found", "We couldn't find that invite.", "Back to sign in"],
    ["revoked", "We couldn't find that invite.", "Back to sign in"],
    ["expired", "This invite expired.", "Back to sign in"],
    ["accepted", "This invite is already set up.", "Sign in"],
  ] as const)("renders the %s state", (status, heading, action) => {
    const p = inviteProps({ status });
    render(<ArtistInvite {...p} />);
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    if (action) {
      fireEvent.click(screen.getByRole("button", { name: action }));
      expect(p.onSignIn).toHaveBeenCalled();
    } else {
      expect(screen.queryByRole("button")).toBeNull();
    }
  });

  it("explains which invalid-link reason applies", () => {
    render(<ArtistInvite {...inviteProps({ status: "expired" })} />);
    expect(screen.getByText(/has expired/)).toBeTruthy();
  });

  it("asks the person to confirm their email once signed up", () => {
    render(<ArtistInvite {...inviteProps({ confirmationPending: true })} />);
    expect(screen.getByRole("heading", { name: "Confirm your email." })).toBeTruthy();
    expect(screen.getByText("t@m.co")).toBeTruthy();
  });

  it("lets a signed-in user accept in one click", () => {
    const p = inviteProps({ status: "ready_signed_in" });
    render(<ArtistInvite {...p} />);
    expect(screen.getByRole("heading", { name: "Add an artist studio." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept & open studio" }));
    expect(p.onSubmit).toHaveBeenCalled();
  });

  it("shows progress for a signed-in user accepting", () => {
    render(<ArtistInvite {...inviteProps({ status: "ready_signed_in", loading: true })} />);
    expect((screen.getByRole("button", { name: "Joining…" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders the signup form with a locked email and the gallery's initial", () => {
    render(<ArtistInvite {...inviteProps()} />);
    expect(screen.getByText("V")).toBeTruthy();
    expect(screen.getByText("Vorster Gallery")).toBeTruthy();
    expect((screen.getByDisplayValue("t@m.co") as HTMLInputElement).disabled).toBe(true);
  });

  it("reports the form fields, the agreement and submission", () => {
    const p = inviteProps();
    render(<ArtistInvite {...p} />);
    change(screen.getByPlaceholderText("Thandiwe Mokoena"), "Thandiwe");
    change(screen.getByPlaceholderText("Painter, sculptor…"), "Painter");
    change(screen.getByPlaceholderText("Johannesburg"), "Durban");
    change(screen.getByPlaceholderText("••••••••••"), "pw");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Accept & create account" }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    expect(p.onName).toHaveBeenCalledWith("Thandiwe");
    expect(p.onPractice).toHaveBeenCalledWith("Painter");
    expect(p.onCity).toHaveBeenCalledWith("Durban");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onAgreed).toHaveBeenCalledWith(true);
    expect(p.onSubmit).toHaveBeenCalled();
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    expect(p.onSignIn).toHaveBeenCalled();
  });
});

function exhibitionProps(over: Partial<React.ComponentProps<typeof ArtistExhibitionInvite>> = {}) {
  return {
    ...inviteProps(), exhibitionTitle: "Highveld Light", exhibitionTheme: "Winter light", exhibitionRules: "Max 3 works.",
    rulesAck: false, onRulesAck: vi.fn(), ...over,
  } as React.ComponentProps<typeof ArtistExhibitionInvite>;
}

describe("ArtistExhibitionInvite", () => {
  it.each([
    ["loading", "Checking your invite…"],
    ["no_token", "Open the link from your gallery."],
    ["not_found", "We couldn't find that invite."],
    ["expired", "This invite expired."],
    ["accepted", "This invite is already set up."],
  ] as const)("renders the %s state", (status, heading) => {
    render(<ArtistExhibitionInvite {...exhibitionProps({ status })} />);
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
  });

  it("names the exhibition when asking to confirm email", () => {
    render(<ArtistExhibitionInvite {...exhibitionProps({ confirmationPending: true })} />);
    expect(screen.getByText(/confirm your place in Highveld Light/)).toBeTruthy();
  });

  it("shows the theme and rules, and acknowledges the rules before joining", () => {
    const p = exhibitionProps({ status: "ready_signed_in" });
    render(<ArtistExhibitionInvite {...p} />);
    expect(screen.getByRole("heading", { name: "Join Highveld Light." })).toBeTruthy();
    expect(screen.getByText("Winter light")).toBeTruthy();
    expect(screen.getByText("Max 3 works.")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(p.onRulesAck).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & join exhibition" }));
    expect(p.onSubmit).toHaveBeenCalled();
  });

  it("omits the rules checkbox when the exhibition has no rules", () => {
    render(<ArtistExhibitionInvite {...exhibitionProps({ status: "ready_signed_in", exhibitionRules: "", exhibitionTheme: "" })} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/Theme:/)).toBeNull();
  });

  it("collects account details, the rules acknowledgement and the terms agreement", () => {
    const p = exhibitionProps();
    render(<ArtistExhibitionInvite {...p} />);
    change(screen.getByPlaceholderText("Thandiwe Mokoena"), "Thandiwe");
    change(screen.getByPlaceholderText("Painter, sculptor…"), "Painter");
    change(screen.getByPlaceholderText("Johannesburg"), "Durban");
    change(screen.getByPlaceholderText("••••••••••"), "pw");
    const [rules, terms] = screen.getAllByRole("checkbox");
    fireEvent.click(rules);
    fireEvent.click(terms);
    fireEvent.click(screen.getByRole("button", { name: "Accept & create account" }));
    expect(p.onName).toHaveBeenCalledWith("Thandiwe");
    expect(p.onPractice).toHaveBeenCalledWith("Painter");
    expect(p.onCity).toHaveBeenCalledWith("Durban");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onRulesAck).toHaveBeenCalledWith(true);
    expect(p.onAgreed).toHaveBeenCalledWith(true);
    expect(p.onSubmit).toHaveBeenCalled();
  });
});
