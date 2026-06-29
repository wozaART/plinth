"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArtistForms, GalleryForms } from "@/components/auth";
import { ErrorBanner } from "@/components/auth/primitives";

type Side = "gallery" | "artist";
type GView = "signin" | "signup" | "forgot";
type AView = "signin" | "invite";
type AStep = "email" | "code";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  // ── Navigation state ──────────────────────────────────────────
  const [side, setSide] = useState<Side>("gallery");
  const [gView, setGView] = useState<GView>("signin");
  const [aView, setAView] = useState<AView>("signin");
  const [aStep, setAStep] = useState<AStep>("email");

  // ── Shared state ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  // ── Gallery form state ────────────────────────────────────────
  const [gEmail, setGEmail] = useState("");
  const [gPassword, setGPassword] = useState("");
  const [signupGalleryName, setSignupGalleryName] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupCity, setSignupCity] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // ── Artist form state ─────────────────────────────────────────
  const [artistEmail, setArtistEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [inviteName, setInviteName] = useState("");
  const [invitePractice, setInvitePractice] = useState("");
  const [inviteCity, setInviteCity] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteAgreed, setInviteAgreed] = useState(true);

  // ── Helpers ───────────────────────────────────────────────────
  const pickSide = (s: Side) => {
    setSide(s);
    setError(null);
    setForgotSent(false);
    setAStep("email");
  };

  const withLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    await fn();
    setLoading(false);
  };

  // ── Gallery handlers ──────────────────────────────────────────
  const handleGallerySignIn = () =>
    withLoad(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: gEmail, password: gPassword });
      if (error) { setError(error.message); return; }
      router.push("/dashboard");
      router.refresh();
    });

  const handleGallerySignUp = () =>
    withLoad(async () => {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { role: "gallery", gallery_name: signupGalleryName, full_name: signupFullName, city: signupCity },
        },
      });
      if (error) { setError(error.message); return; }
      router.push("/dashboard");
      router.refresh();
    });

  const handleForgotPassword = () =>
    withLoad(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/update-password`,
      });
      if (error) { setError(error.message); return; }
      setForgotSent(true);
    });

  const handleOAuth = async (provider: "google" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // ── Artist handlers ───────────────────────────────────────────
  const handleSendCode = (emailOverride?: string) =>
    withLoad(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailOverride ?? artistEmail,
        options: { shouldCreateUser: true },
      });
      if (error) { setError(error.message); return; }
      setAStep("code");
      setOtp(["", "", "", "", "", ""]);
    });

  const handleVerifyOtp = () =>
    withLoad(async () => {
      const token = otp.join("");
      if (token.length < 6) { setError("Please enter the full 6-digit code."); return; }
      const { error } = await supabase.auth.verifyOtp({ email: artistEmail, token, type: "email" });
      if (error) { setError(error.message); return; }
      router.push("/studio");
      router.refresh();
    });

  const handleInviteAccept = () =>
    withLoad(async () => {
      if (!inviteAgreed) { setError("Please agree to the terms to continue."); return; }
      const { error } = await supabase.auth.signInWithOtp({
        email: inviteEmail,
        options: {
          shouldCreateUser: true,
          data: { role: "artist", full_name: inviteName, practice: invitePractice, city: inviteCity },
        },
      });
      if (error) { setError(error.message); return; }
      setArtistEmail(inviteEmail);
      setAView("signin");
      setAStep("code");
      setOtp(["", "", "", "", "", ""]);
    });

  const handleOtpDigit = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const isGallery = side === "gallery";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-wrap min-h-svh w-full">

      {/* ── Left imagery panel ─────────────────────────────────── */}
      <div
        className="flex-[1_1_460px] min-w-0 relative overflow-hidden flex flex-col justify-between transition-[background] duration-300"
        style={{
          padding: "clamp(32px,4vw,52px)",
          minHeight: 340,
          background: isGallery ? "linear-gradient(150deg,#F4F1EA,#EAE5D9)" : "#17150F",
        }}
      >
        <Link href="/" className="relative z-10 inline-flex items-baseline gap-2 self-start">
          <span
            className="font-serif text-2xl font-semibold tracking-[-0.01em]"
            style={{ color: isGallery ? "#17150F" : "#FBFAF8" }}
          >
            Plinth
          </span>
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--pl-accent)] block translate-y-[-2px]" />
        </Link>

        {isGallery && <GalleryPanel />}
        {!isGallery && <ArtistPanel />}

        <div
          className="relative z-10 text-xs"
          style={{ color: isGallery ? "#9A9486" : "#6F695D" }}
        >
          Made for South African contemporary galleries · Johannesburg · Cape Town · Makhanda
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────────── */}
      <div
        className="flex-[1_1_480px] min-w-0 flex flex-col items-center justify-center bg-[var(--pl-bg)]"
        style={{ padding: "clamp(36px,5vw,64px) clamp(22px,4vw,44px)" }}
      >
        <div className="w-full max-w-[392px]">

          {/* Tab toggle */}
          <div className="flex gap-1 bg-[var(--pl-sidebar)] border border-[var(--pl-border)] rounded-[11px] p-1 mb-[34px]">
            {(["gallery", "artist"] as Side[]).map((s) => (
              <button
                key={s}
                onClick={() => pickSide(s)}
                className={`flex-1 py-[9px] border-none rounded-lg font-sans text-[13px] cursor-pointer capitalize transition-colors ${
                  side === s
                    ? "bg-foreground text-on-dark font-semibold shadow-[0_2px_6px_rgba(30,27,20,.18)]"
                    : "bg-transparent text-text-muted font-medium"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {error && <ErrorBanner message={error} />}

          {isGallery && gView === "signin" && (
            <GalleryForms.SignIn
              email={gEmail} password={gPassword} loading={loading}
              onEmail={setGEmail} onPassword={setGPassword}
              onSubmit={handleGallerySignIn}
              onForgot={() => { setGView("forgot"); setError(null); }}
              onSignUp={() => { setGView("signup"); setError(null); }}
              onOAuth={handleOAuth} onError={setError}
            />
          )}

          {isGallery && gView === "signup" && (
            <GalleryForms.SignUp
              galleryName={signupGalleryName} fullName={signupFullName} city={signupCity}
              email={signupEmail} password={signupPassword} loading={loading}
              onGalleryName={setSignupGalleryName} onFullName={setSignupFullName}
              onCity={setSignupCity} onEmail={setSignupEmail} onPassword={setSignupPassword}
              onSubmit={handleGallerySignUp}
              onSignIn={() => { setGView("signin"); setError(null); }}
              onOAuth={handleOAuth} onError={setError}
            />
          )}

          {isGallery && gView === "forgot" && (
            <GalleryForms.Forgot
              email={forgotEmail} sent={forgotSent} loading={loading}
              onEmail={setForgotEmail} onSubmit={handleForgotPassword}
              onBack={() => { setGView("signin"); setForgotSent(false); setError(null); }}
              onError={setError}
            />
          )}

          {!isGallery && aView === "signin" && (
            <ArtistForms.SignIn
              step={aStep} email={artistEmail} otp={otp} otpRefs={otpRefs}
              loading={loading} onEmail={setArtistEmail}
              onOtpDigit={handleOtpDigit} onOtpKeyDown={handleOtpKeyDown}
              onSendCode={() => handleSendCode()}
              onVerify={handleVerifyOtp}
              onResend={() => handleSendCode()}
              onBack={() => { setAStep("email"); setError(null); }}
              onInvite={() => { setAView("invite"); setError(null); }}
              onError={setError}
            />
          )}

          {!isGallery && aView === "invite" && (
            <ArtistForms.Invite
              name={inviteName} practice={invitePractice} city={inviteCity}
              email={inviteEmail} agreed={inviteAgreed} loading={loading}
              onName={setInviteName} onPractice={setInvitePractice}
              onCity={setInviteCity} onEmail={setInviteEmail} onAgreed={setInviteAgreed}
              onSubmit={handleInviteAccept}
              onSignIn={() => { setAView("signin"); setError(null); }}
              onError={setError}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// ── Left panel imagery ──────────────────────────────────────────

function GalleryPanel() {
  return (
    <div className="relative z-10">
      <div className="relative py-2 pb-[30px]">
        <div className="absolute left-0 right-0 h-px bg-[rgba(40,34,28,.14)]" style={{ top: "54%" }} />
        <div className="flex items-end gap-[clamp(14px,2vw,24px)] relative">
          <div className="bg-white p-2 rounded-sm shadow-[0_16px_38px_rgba(40,34,28,.15)] -translate-y-3.5">
            <div
              className="rounded-none"
              style={{ width: "clamp(78px,9vw,104px)", height: "clamp(100px,12vw,134px)", background: "linear-gradient(#6E7355 0 52%, #E7E1D2 52%)" }}
            />
          </div>
          <div className="bg-white p-2.5 rounded-sm shadow-[0_22px_44px_rgba(40,34,28,.18)]">
            <div
              style={{ width: "clamp(92px,11vw,124px)", height: "clamp(118px,14vw,158px)", background: "radial-gradient(circle at 70% 32%, #E9E1D2 0 19%, rgba(233,225,210,0) 19.5%), linear-gradient(155deg,#6E2B2B,#532020)" }}
            />
          </div>
          <div className="bg-white p-2 rounded-sm shadow-[0_16px_38px_rgba(40,34,28,.15)] -translate-y-[9px]">
            <div
              style={{ width: "clamp(78px,9vw,104px)", height: "clamp(100px,12vw,134px)", background: "linear-gradient(120deg,#34406A 0 60%, #C99A3F 60%)" }}
            />
          </div>
        </div>
      </div>
      <h2
        className="font-serif font-medium italic text-text-secondary leading-[1.18] tracking-[-0.01em] mt-6 max-w-[440px]"
        style={{ fontSize: "clamp(24px,2.6vw,32px)" }}
      >
        Mind the art.<br />We'll mind the rest.
      </h2>
      <p className="text-[14px] text-text-muted leading-relaxed mt-3 max-w-[420px]">
        Submissions, exhibitions, catalogue and collectors — the quiet operating system for your gallery.
      </p>
    </div>
  );
}

function ArtistPanel() {
  return (
    <div className="relative z-10">
      <div className="bg-[var(--pl-surface-dark)] border border-border-dark rounded-[var(--pl-radius-card-lg)] p-[18px] max-w-[380px]">
        <div className="flex gap-3 items-center bg-[#2A2620] border-l-[3px] border-[var(--pl-declined-dot)] rounded-[var(--pl-radius-btn)] px-3.5 py-[13px]">
          <div
            className="w-[38px] h-[46px] rounded shrink-0"
            style={{ background: "linear-gradient(135deg,var(--pl-accent) 0 50%, #2A2723 50%)" }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[#D99A8E] font-semibold tracking-[.03em]">NEEDS YOUR RESPONSE</div>
            <div className="text-[13px] font-semibold text-on-dark mt-0.5">City Grid · decision waiting</div>
          </div>
        </div>
        <p className="text-[11.5px] text-on-dark-faint mt-3 leading-[1.55] px-0.5">
          Every decision from your gallery reaches you here — read it, then confirm, before anything travels.
        </p>
      </div>
      <h2
        className="font-serif font-medium italic text-on-dark leading-[1.18] tracking-[-0.01em] mt-7 max-w-[440px]"
        style={{ fontSize: "clamp(24px,2.6vw,32px)" }}
      >
        Your work, kept in good hands.
      </h2>
      <p className="text-[14px] text-on-dark-soft leading-relaxed mt-3 max-w-[420px]">
        Submit to open calls, follow every decision, and never arrive at the door with work that wasn't expected.
      </p>
    </div>
  );
}
