import {
  AuthHeading,
  AuthInput,
  Divider,
  Eyebrow,
  FieldLabel,
  GhostButton,
  OAuthRow,
  PrimaryButton,
} from "./primitives";

interface BaseProps {
  loading: boolean;
  onError: (msg: string | null) => void;
}

// ── Artist · Sign In (password) ────────────────────────────────────

interface ArtistSignInProps extends BaseProps {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
  onForgot: () => void;
  onInvite: () => void;
  onOAuth: (p: "google") => void;
}

export function ArtistSignIn({
  email, password, loading,
  onEmail, onPassword, onSubmit, onForgot, onInvite, onOAuth, onError,
}: ArtistSignInProps) {
  return (
    <div className="anim-fade">
      <Eyebrow>Artist studio</Eyebrow>
      <AuthHeading>Sign in to your studio.</AuthHeading>
      <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-[26px]">
        Submit work, follow decisions, and manage your practice.
      </p>

      <FieldLabel>Email</FieldLabel>
      <AuthInput
        type="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => { onEmail(e.target.value); onError(null); }}
      />

      <div className="flex items-baseline justify-between mt-[18px]">
        <FieldLabel>Password</FieldLabel>
        <GhostButton onClick={onForgot} className="text-[12.5px] text-accent font-medium">
          Forgot password?
        </GhostButton>
      </div>
      <AuthInput
        type="password"
        placeholder="••••••••••"
        value={password}
        onChange={(e) => { onPassword(e.target.value); onError(null); }}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
      />

      <PrimaryButton loading={loading} onClick={onSubmit}>
        {loading ? "Signing in…" : "Sign in"}
      </PrimaryButton>

      <Divider />
      <OAuthRow onGoogle={() => onOAuth("google")} />

      <p className="text-[13px] text-text-muted mt-[30px] text-center">
        Got an invite from a gallery?{" "}
        <GhostButton onClick={onInvite} className="text-[13px] text-foreground font-semibold">
          Accept it →
        </GhostButton>
      </p>
    </div>
  );
}

// ── Artist · Forgot Password ─────────────────────────────────────

interface ArtistForgotProps extends BaseProps {
  email: string;
  sent: boolean;
  onEmail: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function ArtistForgot({ email, sent, loading, onEmail, onSubmit, onBack, onError }: ArtistForgotProps) {
  if (sent) {
    return (
      <div className="anim-fade">
        <div className="w-[46px] h-[46px] rounded-full bg-[var(--pl-approved-bg)] flex items-center justify-center text-[var(--pl-approved-fg)] text-xl mb-[18px]">
          ✓
        </div>
        <Eyebrow>Check your inbox</Eyebrow>
        <AuthHeading className="!text-[clamp(26px,3.2vw,33px)]">Reset link sent.</AuthHeading>
        <p className="text-[14px] text-text-muted leading-relaxed mt-3 mb-7">
          If an account exists for that email, you'll find a link to choose a new password. It expires in 30 minutes.
        </p>
        <PrimaryButton className="!mt-0" onClick={onBack}>
          Back to sign in
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      <GhostButton onClick={onBack} className="text-[12.5px] text-text-soft mb-4 block">
        ← Back to sign in
      </GhostButton>
      <Eyebrow>Reset password</Eyebrow>
      <AuthHeading>Forgot your password?</AuthHeading>
      <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-[26px]">
        Enter your email and we'll send you a link to reset it.
      </p>
      <FieldLabel>Email</FieldLabel>
      <AuthInput
        type="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => { onEmail(e.target.value); onError(null); }}
      />
      <PrimaryButton loading={loading} onClick={onSubmit}>
        {loading ? "Sending…" : "Send reset link"}
      </PrimaryButton>
    </div>
  );
}

// ── Artist · Accept Invite ────────────────────────────────────────

export type InviteStatus = "loading" | "no_token" | "not_found" | "expired" | "accepted" | "revoked" | "ready";

interface ArtistInviteProps extends BaseProps {
  status: InviteStatus;
  galleryName: string;
  email: string;
  name: string;
  practice: string;
  city: string;
  password: string;
  agreed: boolean;
  confirmationPending: boolean;
  onName: (v: string) => void;
  onPractice: (v: string) => void;
  onCity: (v: string) => void;
  onPassword: (v: string) => void;
  onAgreed: (v: boolean) => void;
  onSubmit: () => void;
  onOAuth: (p: "google") => void;
  onSignIn: () => void;
}

export function ArtistInvite({
  status, galleryName, email, name, practice, city, password, agreed, confirmationPending, loading,
  onName, onPractice, onCity, onPassword, onAgreed,
  onSubmit, onOAuth, onSignIn, onError,
}: ArtistInviteProps) {
  if (status === "loading") {
    return (
      <div className="anim-fade">
        <Eyebrow>Accept invitation</Eyebrow>
        <AuthHeading className="!text-[clamp(26px,3.2vw,34px)]">Checking your invite…</AuthHeading>
      </div>
    );
  }

  if (status === "no_token") {
    return (
      <div className="anim-fade">
        <Eyebrow>Accept invitation</Eyebrow>
        <AuthHeading className="!text-[clamp(26px,3.2vw,34px)]">Open the link from your gallery.</AuthHeading>
        <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-7">
          Invites arrive by email with a personal link — open that link to set up your studio.
        </p>
        <PrimaryButton className="!mt-0" onClick={onSignIn}>
          Back to sign in
        </PrimaryButton>
      </div>
    );
  }

  if (status === "not_found" || status === "expired" || status === "revoked") {
    const copy = {
      not_found: "This invite link isn't valid. Double-check the link from your gallery's email.",
      expired: "This invite has expired. Ask the gallery to send you a new one.",
      revoked: "This invite is no longer active. Ask the gallery to send you a new one.",
    }[status];
    return (
      <div className="anim-fade">
        <Eyebrow>Accept invitation</Eyebrow>
        <AuthHeading className="!text-[clamp(26px,3.2vw,34px)]">
          {status === "expired" ? "This invite expired." : "We couldn't find that invite."}
        </AuthHeading>
        <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-7">{copy}</p>
        <PrimaryButton className="!mt-0" onClick={onSignIn}>
          Back to sign in
        </PrimaryButton>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="anim-fade">
        <Eyebrow>Accept invitation</Eyebrow>
        <AuthHeading className="!text-[clamp(26px,3.2vw,34px)]">This invite is already set up.</AuthHeading>
        <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-7">
          Looks like this invitation has already been accepted — sign in instead.
        </p>
        <PrimaryButton className="!mt-0" onClick={onSignIn}>
          Sign in
        </PrimaryButton>
      </div>
    );
  }

  if (confirmationPending) {
    return (
      <div className="anim-fade">
        <div className="w-[46px] h-[46px] rounded-full bg-[var(--pl-approved-bg)] flex items-center justify-center text-[var(--pl-approved-fg)] text-xl mb-[18px]">
          ✓
        </div>
        <Eyebrow>Check your inbox</Eyebrow>
        <AuthHeading className="!text-[clamp(26px,3.2vw,33px)]">Confirm your email.</AuthHeading>
        <p className="text-[14px] text-text-muted leading-relaxed mt-3 mb-7">
          We sent a confirmation link to <strong>{email}</strong>. Click it to finish joining {galleryName} and enter your studio.
        </p>
      </div>
    );
  }

  // status === "ready"
  return (
    <div className="anim-fade">
      <div className="flex items-center gap-[11px] bg-sidebar border border-border rounded-[var(--pl-radius-card)] px-[15px] py-[13px] mb-[22px]">
        <div className="w-[38px] h-[38px] rounded-[9px] bg-gradient-to-br from-[#2A2723] to-[#57534A] text-on-dark flex items-center justify-center font-serif text-base font-semibold shrink-0">
          {galleryName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-foreground">{galleryName}</div>
          <div className="text-[12px] text-text-soft">invited you to join their artist portal</div>
        </div>
      </div>

      <Eyebrow>Accept invitation</Eyebrow>
      <AuthHeading className="!text-[clamp(26px,3.2vw,34px)]">Set up your artist studio.</AuthHeading>
      <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-6">
        This becomes your space to submit work, apply to open calls, and follow every decision.
      </p>

      <FieldLabel>Email</FieldLabel>
      <AuthInput type="email" value={email} disabled />

      <div className="mt-4">
        <FieldLabel>Your name</FieldLabel>
        <AuthInput
          placeholder="Thandiwe Mokoena"
          value={name}
          onChange={(e) => onName(e.target.value)}
        />
      </div>

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
        <FieldLabel>Choose a password</FieldLabel>
        <AuthInput
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => { onPassword(e.target.value); onError(null); }}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
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
          I agree to Plinth&apos;s terms, and to receive decisions and drop-off passes from {galleryName} by email.
        </span>
      </label>

      <PrimaryButton loading={loading} onClick={onSubmit}>
        {loading ? "Setting up…" : "Accept & create account"}
      </PrimaryButton>

      <Divider label="or continue with" />
      <OAuthRow onGoogle={() => onOAuth("google")} />

      <p className="text-[13px] text-text-muted mt-[22px] text-center">
        Already set up?{" "}
        <GhostButton onClick={onSignIn} className="text-[13px] text-foreground font-semibold">
          Sign in →
        </GhostButton>
      </p>
    </div>
  );
}
