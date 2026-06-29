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

// ── Gallery · Sign In ────────────────────────────────────────────

interface SignInProps extends BaseProps {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
  onForgot: () => void;
  onSignUp: () => void;
  onOAuth: (p: "google" | "apple") => void;
}

export function GallerySignIn({
  email, password, loading,
  onEmail, onPassword, onSubmit, onForgot, onSignUp, onOAuth, onError,
}: SignInProps) {
  return (
    <div className="anim-fade">
      <Eyebrow>Gallery dashboard</Eyebrow>
      <AuthHeading>Welcome back.</AuthHeading>
      <p className="text-[14px] text-text-muted mt-[11px] mb-7">Sign in to run your programme.</p>

      <FieldLabel>Email</FieldLabel>
      <AuthInput
        type="email"
        placeholder="curator@yourgallery.co.za"
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
      <OAuthRow onGoogle={() => onOAuth("google")} onApple={() => onOAuth("apple")} />

      <p className="text-[13px] text-text-muted mt-[30px] text-center">
        New to Plinth?{" "}
        <GhostButton onClick={onSignUp} className="text-[13px] text-foreground font-semibold">
          Create your gallery →
        </GhostButton>
      </p>
    </div>
  );
}

// ── Gallery · Sign Up ────────────────────────────────────────────

interface SignUpProps extends BaseProps {
  galleryName: string;
  fullName: string;
  city: string;
  email: string;
  password: string;
  onGalleryName: (v: string) => void;
  onFullName: (v: string) => void;
  onCity: (v: string) => void;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
  onSignIn: () => void;
  onOAuth: (p: "google" | "apple") => void;
}

export function GallerySignUp({
  galleryName, fullName, city, email, password, loading,
  onGalleryName, onFullName, onCity, onEmail, onPassword,
  onSubmit, onSignIn, onOAuth, onError,
}: SignUpProps) {
  return (
    <div className="anim-fade">
      <Eyebrow>Create your gallery</Eyebrow>
      <AuthHeading>Set up your space.</AuthHeading>
      <p className="text-[14px] text-text-muted mt-[11px] mb-[26px]">
        A few details and your dashboard is ready.
      </p>

      <FieldLabel>Gallery name</FieldLabel>
      <AuthInput
        placeholder="Vorster Gallery"
        value={galleryName}
        onChange={(e) => onGalleryName(e.target.value)}
      />

      <div className="flex gap-3 mt-4">
        <div className="flex-1">
          <FieldLabel>Your name</FieldLabel>
          <AuthInput
            placeholder="Naledi Marais"
            value={fullName}
            onChange={(e) => onFullName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <FieldLabel>City</FieldLabel>
          <AuthInput
            placeholder="Cape Town"
            value={city}
            onChange={(e) => onCity(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Work email</FieldLabel>
        <AuthInput
          type="email"
          placeholder="you@yourgallery.co.za"
          value={email}
          onChange={(e) => { onEmail(e.target.value); onError(null); }}
        />
      </div>

      <div className="mt-4">
        <FieldLabel>Password</FieldLabel>
        <AuthInput
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={(e) => { onPassword(e.target.value); onError(null); }}
        />
      </div>

      <PrimaryButton loading={loading} onClick={onSubmit}>
        {loading ? "Creating…" : "Create gallery"}
      </PrimaryButton>

      <Divider label="or sign up with" />
      <OAuthRow onGoogle={() => onOAuth("google")} onApple={() => onOAuth("apple")} />

      <p className="text-[13px] text-text-muted mt-[26px] text-center">
        Already have an account?{" "}
        <GhostButton onClick={onSignIn} className="text-[13px] text-foreground font-semibold">
          Sign in →
        </GhostButton>
      </p>
    </div>
  );
}

// ── Gallery · Forgot Password ─────────────────────────────────────

interface ForgotProps extends BaseProps {
  email: string;
  sent: boolean;
  onEmail: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function GalleryForgot({ email, sent, loading, onEmail, onSubmit, onBack, onError }: ForgotProps) {
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
        Enter your gallery email and we'll send you a link to reset it.
      </p>
      <FieldLabel>Email</FieldLabel>
      <AuthInput
        type="email"
        placeholder="curator@yourgallery.co.za"
        value={email}
        onChange={(e) => { onEmail(e.target.value); onError(null); }}
      />
      <PrimaryButton loading={loading} onClick={onSubmit}>
        {loading ? "Sending…" : "Send reset link"}
      </PrimaryButton>
    </div>
  );
}
