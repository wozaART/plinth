import type React from "react";
import {
  AuthHeading,
  AuthInput,
  Eyebrow,
  FieldLabel,
  GhostButton,
  PrimaryButton,
} from "./primitives";

interface BaseProps {
  loading: boolean;
  onError: (msg: string | null) => void;
}

// ── Artist · Sign In (OTP) ────────────────────────────────────────

interface ArtistSignInProps extends BaseProps {
  step: "email" | "code";
  email: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onEmail: (v: string) => void;
  onOtpDigit: (i: number, v: string) => void;
  onOtpKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendCode: () => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  onInvite: () => void;
}

export function ArtistSignIn({
  step, email, otp, otpRefs, loading,
  onEmail, onOtpDigit, onOtpKeyDown,
  onSendCode, onVerify, onResend, onBack, onInvite, onError,
}: ArtistSignInProps) {
  if (step === "email") {
    return (
      <div className="anim-fade">
        <Eyebrow>Artist studio</Eyebrow>
        <AuthHeading>Sign in to your studio.</AuthHeading>
        <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-[26px]">
          No password to remember — we'll email you a one-time code.
        </p>
        <FieldLabel>Email</FieldLabel>
        <AuthInput
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => { onEmail(e.target.value); onError(null); }}
          onKeyDown={(e) => e.key === "Enter" && onSendCode()}
        />
        <PrimaryButton loading={loading} onClick={onSendCode}>
          {loading ? "Sending…" : "Email me a sign-in code"}
        </PrimaryButton>
        <p className="text-[13px] text-text-muted mt-[30px] text-center">
          Got an invite from a gallery?{" "}
          <GhostButton onClick={onInvite} className="text-[13px] text-foreground font-semibold">
            Accept it →
          </GhostButton>
        </p>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      <GhostButton onClick={onBack} className="text-[12.5px] text-text-soft mb-4 block">
        ← Use a different email
      </GhostButton>
      <Eyebrow>Check your email</Eyebrow>
      <AuthHeading className="!text-[clamp(26px,3.2vw,33px)]">Enter your code.</AuthHeading>
      <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-6">
        We sent a 6-digit code to your inbox. It's valid for 10 minutes.
      </p>

      <div className="flex gap-[9px]">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            maxLength={1}
            inputMode="numeric"
            className="flex-1 aspect-square text-center border border-border-input bg-surface rounded-[var(--pl-radius-input)] font-serif text-2xl font-medium text-foreground"
            value={digit}
            onChange={(e) => { onOtpDigit(i, e.target.value); onError(null); }}
            onKeyDown={(e) => onOtpKeyDown(i, e)}
          />
        ))}
      </div>

      <PrimaryButton loading={loading} onClick={onVerify}>
        {loading ? "Verifying…" : "Verify & enter studio"}
      </PrimaryButton>

      <p className="text-[13px] text-text-muted mt-[22px] text-center">
        Didn't get it?{" "}
        <GhostButton onClick={onResend} className="text-[13px] text-accent font-[550]">
          Resend code
        </GhostButton>
      </p>
    </div>
  );
}

// ── Artist · Accept Invite ────────────────────────────────────────

interface ArtistInviteProps extends BaseProps {
  name: string;
  practice: string;
  city: string;
  email: string;
  agreed: boolean;
  onName: (v: string) => void;
  onPractice: (v: string) => void;
  onCity: (v: string) => void;
  onEmail: (v: string) => void;
  onAgreed: (v: boolean) => void;
  onSubmit: () => void;
  onSignIn: () => void;
}

export function ArtistInvite({
  name, practice, city, email, agreed, loading,
  onName, onPractice, onCity, onEmail, onAgreed,
  onSubmit, onSignIn, onError,
}: ArtistInviteProps) {
  return (
    <div className="anim-fade">
      <div className="flex items-center gap-[11px] bg-sidebar border border-border rounded-[var(--pl-radius-card)] px-[15px] py-[13px] mb-[22px]">
        <div className="w-[38px] h-[38px] rounded-[9px] bg-gradient-to-br from-[#2A2723] to-[#57534A] text-on-dark flex items-center justify-center font-serif text-base font-semibold shrink-0">
          V
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-foreground">Vorster Gallery</div>
          <div className="text-[12px] text-text-soft">invited you to submit work</div>
        </div>
      </div>

      <Eyebrow>Accept invitation</Eyebrow>
      <AuthHeading className="!text-[clamp(26px,3.2vw,34px)]">Set up your artist studio.</AuthHeading>
      <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-6">
        This becomes your space to submit work, apply to open calls, and follow every decision.
      </p>

      <FieldLabel>Your name</FieldLabel>
      <AuthInput
        placeholder="Thandiwe Mokoena"
        value={name}
        onChange={(e) => onName(e.target.value)}
      />

      <div className="flex gap-3 mt-4">
        <div style={{ flex: 1.3 }}>
          <FieldLabel>Practice</FieldLabel>
          <AuthInput
            placeholder="Painter, sculptor…"
            value={practice}
            onChange={(e) => onPractice(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <FieldLabel>Based in</FieldLabel>
          <AuthInput
            placeholder="Johannesburg"
            value={city}
            onChange={(e) => onCity(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Email</FieldLabel>
        <AuthInput
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => { onEmail(e.target.value); onError(null); }}
        />
      </div>

      <label className="flex gap-[10px] items-start mt-5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 accent-foreground"
        />
        <span className="text-[12.5px] text-text-muted leading-relaxed">
          I agree to Plinth's terms, and to receive decisions and drop-off passes from Vorster Gallery by email.
        </span>
      </label>

      <PrimaryButton loading={loading} onClick={onSubmit}>
        {loading ? "Setting up…" : "Accept & enter studio"}
      </PrimaryButton>

      <p className="text-[13px] text-text-muted mt-[22px] text-center">
        Already set up?{" "}
        <GhostButton onClick={onSignIn} className="text-[13px] text-foreground font-semibold">
          Sign in →
        </GhostButton>
      </p>
    </div>
  );
}
