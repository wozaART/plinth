// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ArtistExhibitionInvite,
  ArtistForgot,
  ArtistInvite,
  ArtistSignIn,
  type ExhibitionInviteStatus,
  type InviteStatus,
} from "./ArtistForms";

const fns = () => ({
  onName: vi.fn(), onPractice: vi.fn(), onCity: vi.fn(), onPassword: vi.fn(), onAgreed: vi.fn(), onRulesAck: vi.fn(),
  onSubmit: vi.fn(), onOAuth: vi.fn(), onSignIn: vi.fn(), onError: vi.fn(),
});

describe("ArtistSignIn", () => {
  function setup(loading = false) {
    const p = { email: "", password: "", loading, onEmail: vi.fn(), onPassword: vi.fn(), onSubmit: vi.fn(), onForgot: vi.fn(), onInvite: vi.fn(), onOAuth: vi.fn(), onError: vi.fn() };
    render(<ArtistSignIn {...p} />);
    return p;
  }

  it("reports typing, submits on button and Enter, and clears errors", () => {
    const p = setup();
    fireEvent.change(screen.getByPlaceholderText("you@email.com"), { target: { value: "a@b.co" } });
    const pw = screen.getByPlaceholderText("••••••••••");
    fireEvent.change(pw, { target: { value: "pw" } });
    expect(p.onEmail).toHaveBeenCalledWith("a@b.co");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onError).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(pw, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(p.onSubmit).toHaveBeenCalledTimes(2);
  });

  it("links to forgot password, Google and accepting an invite", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    fireEvent.click(screen.getByRole("button", { name: /Accept it/ }));
    expect(p.onForgot).toHaveBeenCalled();
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    expect(p.onInvite).toHaveBeenCalled();
  });

  it("disables the button while loading", () => {
    setup(true);
    expect((screen.getByRole("button", { name: "Signing in…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ArtistForgot", () => {
  it("sends the reset link, then shows the confirmation", () => {
    const p = { email: "", loading: false, onEmail: vi.fn(), onSubmit: vi.fn(), onBack: vi.fn(), onError: vi.fn() };
    const { rerender } = render(<ArtistForgot {...p} sent={false} />);
    fireEvent.change(screen.getByPlaceholderText("you@email.com"), { target: { value: "a@b.co" } });
    expect(p.onEmail).toHaveBeenCalledWith("a@b.co");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(p.onSubmit).toHaveBeenCalled();
    rerender(<ArtistForgot {...p} sent />);
    expect(screen.getByText("Reset link sent.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(p.onBack).toHaveBeenCalled();
  });

  it("shows progress while sending", () => {
    render(<ArtistForgot email="" loading sent={false} onEmail={vi.fn()} onSubmit={vi.fn()} onBack={vi.fn()} onError={vi.fn()} />);
    expect((screen.getByRole("button", { name: "Sending…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ArtistInvite", () => {
  function setup(over: Partial<React.ComponentProps<typeof ArtistInvite>> = {}) {
    const p = {
      status: "ready" as InviteStatus, galleryName: "Woza Art", email: "t@x.co", name: "", practice: "", city: "", password: "",
      agreed: false, confirmationPending: false, loading: false, ...fns(), ...over,
    };
    render(<ArtistInvite {...p} />);
    return p;
  }

  it("shows a neutral heading while the invite is checked", () => {
    setup({ status: "loading" });
    expect(screen.getByText("Checking your invite…")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.each([
    ["no_token", "Open the link from your gallery.", "Back to sign in"],
    ["not_found", "We couldn't find that invite.", "Back to sign in"],
    ["revoked", "We couldn't find that invite.", "Back to sign in"],
    ["expired", "This invite expired.", "Back to sign in"],
    ["accepted", "This invite is already set up.", "Sign in"],
  ] as [InviteStatus, string, string][])("status %s explains the problem and offers a way out", (status, heading, button) => {
    const p = setup({ status });
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(p.onSignIn).toHaveBeenCalled();
  });

  it("explains each unusable-link state with its own copy", () => {
    setup({ status: "expired" });
    expect(screen.getByText(/has expired/)).toBeTruthy();
  });

  it("asks the user to confirm their email when confirmation is pending", () => {
    setup({ confirmationPending: true, email: "t@x.co" });
    expect(screen.getByText("Confirm your email.")).toBeTruthy();
    expect(screen.getByText("t@x.co")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Thandiwe Mokoena")).toBeNull();
  });

  it("lets a signed-in user accept without a form", () => {
    const p = setup({ status: "ready_signed_in" });
    expect(screen.queryByPlaceholderText("Thandiwe Mokoena")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Accept & open studio" }));
    expect(p.onSubmit).toHaveBeenCalled();
  });

  it("shows the joining state for a signed-in user", () => {
    setup({ status: "ready_signed_in", loading: true });
    expect((screen.getByRole("button", { name: "Joining…" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders the sign-up form with the email locked and the gallery initial", () => {
    setup();
    const email = screen.getByDisplayValue("t@x.co") as HTMLInputElement;
    expect(email.disabled).toBe(true);
    expect(screen.getByText("W")).toBeTruthy();
  });

  it("reports the profile fields and agreement", () => {
    const p = setup();
    fireEvent.change(screen.getByPlaceholderText("Thandiwe Mokoena"), { target: { value: "Thandi" } });
    fireEvent.change(screen.getByPlaceholderText("Painter, sculptor…"), { target: { value: "Painter" } });
    fireEvent.change(screen.getByPlaceholderText("Johannesburg"), { target: { value: "Cape Town" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(p.onName).toHaveBeenCalledWith("Thandi");
    expect(p.onPractice).toHaveBeenCalledWith("Painter");
    expect(p.onCity).toHaveBeenCalledWith("Cape Town");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onError).toHaveBeenCalledWith(null);
    expect(p.onAgreed).toHaveBeenCalledWith(true);
  });

  it("submits via the button, Enter in the password field, Google and the sign-in link", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Accept & create account" }));
    fireEvent.keyDown(screen.getByPlaceholderText("••••••••••"), { key: "Enter" });
    expect(p.onSubmit).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    expect(p.onSignIn).toHaveBeenCalled();
  });

  it("disables submit while loading", () => {
    setup({ loading: true });
    expect((screen.getByRole("button", { name: "Setting up…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ArtistExhibitionInvite", () => {
  function setup(over: Partial<React.ComponentProps<typeof ArtistExhibitionInvite>> = {}) {
    const p = {
      status: "ready" as ExhibitionInviteStatus, galleryName: "Woza Art", exhibitionTitle: "Highveld Light", exhibitionTheme: "Landscape",
      exhibitionRules: "Max 3 works", email: "t@x.co", name: "", practice: "", city: "", password: "", agreed: false, rulesAck: false,
      confirmationPending: false, loading: false, ...fns(), ...over,
    };
    render(<ArtistExhibitionInvite {...p} />);
    return p;
  }

  it.each([
    ["no_token", "Open the link from your gallery."],
    ["not_found", "We couldn't find that invite."],
    ["revoked", "We couldn't find that invite."],
    ["expired", "This invite expired."],
    ["accepted", "This invite is already set up."],
  ] as [ExhibitionInviteStatus, string][])("status %s shows its message and a way back", (status, heading) => {
    const p = setup({ status });
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    expect(p.onSignIn).toHaveBeenCalled();
  });

  it("shows the loading heading", () => {
    setup({ status: "loading" });
    expect(screen.getByText("Checking your invite…")).toBeTruthy();
  });

  it("mentions the exhibition when email confirmation is pending", () => {
    setup({ confirmationPending: true });
    expect(screen.getByText(/confirm your place in Highveld Light/)).toBeTruthy();
  });

  it("shows the exhibition, theme and rules on the sign-up form", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Join Highveld Light." })).toBeTruthy();
    expect(screen.getByText("Landscape", { exact: false })).toBeTruthy();
    expect(screen.getByText("Max 3 works", { exact: false })).toBeTruthy();
  });

  it("requires acknowledging the rules only when there are rules", () => {
    const p = setup();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    fireEvent.click(screen.getByLabelText(/read and understand the rules/));
    expect(p.onRulesAck).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByLabelText(/I agree to Woza Art/));
    expect(p.onAgreed).toHaveBeenCalledWith(true);
  });

  it("omits the rules acknowledgement and theme when the exhibition has none", () => {
    setup({ exhibitionRules: "", exhibitionTheme: "" });
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.queryByText("Rules:")).toBeNull();
    expect(screen.queryByText("Theme:")).toBeNull();
  });

  it("lets a signed-in user confirm and join", () => {
    const p = setup({ status: "ready_signed_in" });
    fireEvent.click(screen.getByLabelText(/read and understand the rules/));
    expect(p.onRulesAck).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Confirm & join exhibition" }));
    expect(p.onSubmit).toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("Thandiwe Mokoena")).toBeNull();
  });

  it("shows the joining state for a signed-in user", () => {
    setup({ status: "ready_signed_in", loading: true });
    expect((screen.getByRole("button", { name: "Joining…" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("reports profile fields and submits", () => {
    const p = setup();
    fireEvent.change(screen.getByPlaceholderText("Thandiwe Mokoena"), { target: { value: "Thandi" } });
    fireEvent.change(screen.getByPlaceholderText("Painter, sculptor…"), { target: { value: "Painter" } });
    fireEvent.change(screen.getByPlaceholderText("Johannesburg"), { target: { value: "Pretoria" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "pw" } });
    fireEvent.keyDown(screen.getByPlaceholderText("••••••••••"), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Accept & create account" }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    expect(p.onName).toHaveBeenCalledWith("Thandi");
    expect(p.onPractice).toHaveBeenCalledWith("Painter");
    expect(p.onCity).toHaveBeenCalledWith("Pretoria");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onSubmit).toHaveBeenCalledTimes(2);
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    expect(p.onSignIn).toHaveBeenCalled();
  });
});
