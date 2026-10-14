// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GalleryForgot, GallerySignIn, GallerySignUp } from "./GalleryForms";

const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

function signIn(over: Partial<React.ComponentProps<typeof GallerySignIn>> = {}) {
  const props = { email: "", password: "", loading: false, onEmail: vi.fn(), onPassword: vi.fn(), onSubmit: vi.fn(), onForgot: vi.fn(), onSignUp: vi.fn(), onOAuth: vi.fn(), onError: vi.fn(), ...over };
  render(<GallerySignIn {...props} />);
  return props;
}

describe("GallerySignIn", () => {
  it("reports typing and clears any previous error", () => {
    const p = signIn();
    change(screen.getByPlaceholderText("curator@yourgallery.co.za"), "a@b.co");
    change(screen.getByPlaceholderText("••••••••••"), "secret");
    expect(p.onEmail).toHaveBeenCalledWith("a@b.co");
    expect(p.onPassword).toHaveBeenCalledWith("secret");
    expect(p.onError).toHaveBeenCalledTimes(2);
    expect(p.onError).toHaveBeenCalledWith(null);
  });

  it("submits from the button and from Enter in the password field", () => {
    const p = signIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    const pw = screen.getByPlaceholderText("••••••••••");
    fireEvent.keyDown(pw, { key: "a" });
    expect(p.onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(pw, { key: "Enter" });
    expect(p.onSubmit).toHaveBeenCalledTimes(2);
  });

  it("disables the button while loading", () => {
    signIn({ loading: true });
    const btn = screen.getByRole("button", { name: "Signing in…" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("wires up forgot password, Google and create-gallery", () => {
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
    const p = {
      galleryName: "", fullName: "", city: "", email: "", password: "", loading,
      onGalleryName: vi.fn(), onFullName: vi.fn(), onCity: vi.fn(), onEmail: vi.fn(), onPassword: vi.fn(),
      onSubmit: vi.fn(), onSignIn: vi.fn(), onOAuth: vi.fn(), onError: vi.fn(),
    };
    render(<GallerySignUp {...p} />);
    return p;
  }

  it("reports each field", () => {
    const p = setup();
    change(screen.getByPlaceholderText("Vorster Gallery"), "Vorster");
    change(screen.getByPlaceholderText("Naledi Marais"), "Naledi");
    change(screen.getByPlaceholderText("Cape Town"), "Durban");
    change(screen.getByPlaceholderText("you@yourgallery.co.za"), "n@v.co");
    change(screen.getByPlaceholderText("Choose a password"), "pw");
    expect(p.onGalleryName).toHaveBeenCalledWith("Vorster");
    expect(p.onFullName).toHaveBeenCalledWith("Naledi");
    expect(p.onCity).toHaveBeenCalledWith("Durban");
    expect(p.onEmail).toHaveBeenCalledWith("n@v.co");
    expect(p.onPassword).toHaveBeenCalledWith("pw");
  });

  it("submits, signs in and uses Google", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("button", { name: "Create gallery" }));
    fireEvent.click(screen.getByRole("button", { name: /Google/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    expect(p.onSubmit).toHaveBeenCalled();
    expect(p.onOAuth).toHaveBeenCalledWith("google");
    expect(p.onSignIn).toHaveBeenCalled();
  });

  it("shows progress while creating", () => {
    setup(true);
    expect((screen.getByRole("button", { name: "Creating…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("GalleryForgot", () => {
  const base = { email: "", sent: false, loading: false, onEmail: vi.fn(), onSubmit: vi.fn(), onBack: vi.fn(), onError: vi.fn() };

  it("requests a reset link and can go back", () => {
    const onSubmit = vi.fn();
    const onBack = vi.fn();
    render(<GalleryForgot {...base} onSubmit={onSubmit} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    fireEvent.click(screen.getByRole("button", { name: /Back to sign in/ }));
    expect(onSubmit).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it("confirms once the link is sent", () => {
    const onBack = vi.fn();
    render(<GalleryForgot {...base} sent onBack={onBack} />);
    expect(screen.getByRole("heading", { name: "Reset link sent." })).toBeTruthy();
    expect(screen.queryByPlaceholderText("curator@yourgallery.co.za")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(onBack).toHaveBeenCalled();
  });
});
