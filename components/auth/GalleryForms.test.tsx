// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GalleryForgot, GallerySignIn, GallerySignUp } from "./GalleryForms";

function signIn(over: Partial<React.ComponentProps<typeof GallerySignIn>> = {}) {
  const props = {
    email: "", password: "", loading: false,
    onEmail: vi.fn(), onPassword: vi.fn(), onSubmit: vi.fn(), onForgot: vi.fn(), onSignUp: vi.fn(), onOAuth: vi.fn(), onError: vi.fn(),
    ...over,
  };
  render(<GallerySignIn {...props} />);
  return props;
}

describe("GallerySignIn", () => {
  it("reports typed values and clears any error", () => {
    const p = signIn();
    fireEvent.change(screen.getByPlaceholderText("curator@yourgallery.co.za"), { target: { value: "a@b.co" } });
    expect(p.onEmail).toHaveBeenCalledWith("a@b.co");
    fireEvent.change(screen.getByPlaceholderText("••••••••••"), { target: { value: "secret" } });
    expect(p.onPassword).toHaveBeenCalledWith("secret");
    expect(p.onError).toHaveBeenCalledTimes(2);
    expect(p.onError).toHaveBeenCalledWith(null);
  });

  it("submits from the button and from Enter in the password field only", () => {
    const p = signIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(p.onSubmit).toHaveBeenCalledTimes(1);
    const pw = screen.getByPlaceholderText("••••••••••");
    fireEvent.keyDown(pw, { key: "a" });
    expect(p.onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(pw, { key: "Enter" });
    expect(p.onSubmit).toHaveBeenCalledTimes(2);
  });

  it("disables the button and shows progress while loading", () => {
    signIn({ loading: true });
    const btn = screen.getByRole("button", { name: "Signing in…" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("wires up forgot password, Google and create-gallery links", () => {
    const p = signIn();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    fireEvent.click(screen.getByRole("button", { name: /Create your gallery/ }));
    expect(p.onForgot).toHaveBeenCalled();
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    expect(p.onSignUp).toHaveBeenCalled();
  });
});

describe("GallerySignUp", () => {
  function setup(loading = false) {
    const props = {
      galleryName: "", fullName: "", city: "", email: "", password: "", loading,
      onGalleryName: vi.fn(), onFullName: vi.fn(), onCity: vi.fn(), onEmail: vi.fn(), onPassword: vi.fn(),
      onSubmit: vi.fn(), onSignIn: vi.fn(), onOAuth: vi.fn(), onError: vi.fn(),
    };
    render(<GallerySignUp {...props} />);
    return props;
  }

  it("reports each field, clearing errors only for email and password", () => {
    const p = setup();
    fireEvent.change(screen.getByPlaceholderText("Vorster Gallery"), { target: { value: "Vorster" } });
    fireEvent.change(screen.getByPlaceholderText("Naledi Marais"), { target: { value: "Naledi" } });
    fireEvent.change(screen.getByPlaceholderText("Cape Town"), { target: { value: "Durban" } });
    expect(p.onGalleryName).toHaveBeenCalledWith("Vorster");
    expect(p.onFullName).toHaveBeenCalledWith("Naledi");
    expect(p.onCity).toHaveBeenCalledWith("Durban");
    expect(p.onError).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("you@yourgallery.co.za"), { target: { value: "n@v.co" } });
    fireEvent.change(screen.getByPlaceholderText("Choose a password"), { target: { value: "pw" } });
    expect(p.onEmail).toHaveBeenCalledWith("n@v.co");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
    expect(p.onError).toHaveBeenCalledTimes(2);
  });

  it("submits, switches to sign in and starts Google sign-up", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Create gallery" }));
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    expect(p.onSubmit).toHaveBeenCalled();
    expect(p.onSignIn).toHaveBeenCalled();
    expect(p.onOAuth).toHaveBeenCalledWith("google");
  });

  it("shows the creating state while loading", () => {
    setup(true);
    expect((screen.getByRole("button", { name: "Creating…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("GalleryForgot", () => {
  const base = { email: "", loading: false, onEmail: vi.fn(), onSubmit: vi.fn(), onBack: vi.fn(), onError: vi.fn() };

  it("collects the email and sends the reset link", () => {
    const p = { ...base, onEmail: vi.fn(), onSubmit: vi.fn(), onBack: vi.fn(), onError: vi.fn() };
    render(<GalleryForgot {...p} sent={false} />);
    fireEvent.change(screen.getByPlaceholderText("curator@yourgallery.co.za"), { target: { value: "a@b.co" } });
    expect(p.onEmail).toHaveBeenCalledWith("a@b.co");
    expect(p.onError).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(p.onSubmit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Back to sign in/ }));
    expect(p.onBack).toHaveBeenCalled();
  });

  it("shows progress while sending", () => {
    render(<GalleryForgot {...base} loading sent={false} />);
    expect((screen.getByRole("button", { name: "Sending…" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the confirmation once sent, with no email field", () => {
    const onBack = vi.fn();
    render(<GalleryForgot {...base} onBack={onBack} sent />);
    expect(screen.getByText("Reset link sent.")).toBeTruthy();
    expect(screen.queryByPlaceholderText("curator@yourgallery.co.za")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(onBack).toHaveBeenCalled();
  });
});
