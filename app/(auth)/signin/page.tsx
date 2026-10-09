"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArtistForms, GalleryForms } from "@/components/auth";
import type { InviteStatus, ExhibitionInviteStatus } from "@/components/auth/ArtistForms";
import { ErrorBanner } from "@/components/auth/primitives";

type Side = "gallery" | "artist";
type GView = "signin" | "signup" | "forgot";
type AView = "signin" | "forgot" | "invite" | "exhibition-invite";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const inviteToken = searchParams.get("invite");
  const exhibitionInviteToken = searchParams.get("exhibition_invite");

  // ── Navigation state ──────────────────────────────────────────
  const [side, setSide] = useState<Side>(inviteToken || exhibitionInviteToken ? "artist" : "gallery");
  const [gView, setGView] = useState<GView>("signin");
  const [aView, setAView] = useState<AView>(inviteToken ? "invite" : exhibitionInviteToken ? "exhibition-invite" : "signin");

  // ── Shared state ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [forgotSent, setForgotSent] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

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
  const [artistPassword, setArtistPassword] = useState("");

  // ── Invite state ──────────────────────────────────────────────
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>(inviteToken ? "loading" : "no_token");
  const [inviteGalleryName, setInviteGalleryName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePractice, setInvitePractice] = useState("");
  const [inviteCity, setInviteCity] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteAgreed, setInviteAgreed] = useState(true);
  const [inviteConfirmationPending, setInviteConfirmationPending] = useState(false);

  // ── Exhibition invite state ─────────────────────────────────────
  const [exInviteStatus, setExInviteStatus] = useState<ExhibitionInviteStatus>(exhibitionInviteToken ? "loading" : "no_token");
  const [exInviteGalleryName, setExInviteGalleryName] = useState("");
  const [exInviteExhibitionTitle, setExInviteExhibitionTitle] = useState("");
  const [exInviteExhibitionTheme, setExInviteExhibitionTheme] = useState("");
  const [exInviteExhibitionRules, setExInviteExhibitionRules] = useState("");
  const [exInviteEmail, setExInviteEmail] = useState("");
  const [exInviteName, setExInviteName] = useState("");
  const [exInvitePractice, setExInvitePractice] = useState("");
  const [exInviteCity, setExInviteCity] = useState("");
  const [exInvitePassword, setExInvitePassword] = useState("");
  const [exInviteAgreed, setExInviteAgreed] = useState(true);
  const [exInviteRulesAck, setExInviteRulesAck] = useState(false);
  const [exInviteConfirmationPending, setExInviteConfirmationPending] = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;

    (async () => {
      const { data, error: rpcError } = await supabase
        .rpc("get_artist_invite", { p_token: inviteToken })
        .maybeSingle();
      if (cancelled) return;

      if (rpcError || !data) {
        setInviteStatus("not_found");
        return;
      }
      setInviteEmail(data.email);
      setInviteName(data.full_name ?? "");
      setInviteGalleryName(data.gallery_name);

      if (data.status === "accepted") setInviteStatus("accepted");
      else if (data.status === "revoked") setInviteStatus("revoked");
      else if (data.status === "expired" || new Date(data.expires_at) < new Date()) setInviteStatus("expired");
      else {
        // Already signed in as the invited address (e.g. a gallery owner
        // adding an artist studio to their account): skip account creation.
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        setInviteStatus(signedInUser?.email?.toLowerCase() === data.email.toLowerCase() ? "ready_signed_in" : "ready");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  useEffect(() => {
    if (!exhibitionInviteToken) return;
    let cancelled = false;

    (async () => {
      const { data, error: rpcError } = await supabase
        .rpc("get_exhibition_invite", { p_token: exhibitionInviteToken })
        .maybeSingle();
      if (cancelled) return;

      if (rpcError || !data) {
        setExInviteStatus("not_found");
        return;
      }
      setExInviteEmail(data.email);
      setExInviteName(data.full_name ?? "");
      setExInviteGalleryName(data.gallery_name);
      setExInviteExhibitionTitle(data.exhibition_title);
      setExInviteExhibitionTheme(data.exhibition_theme ?? "");
      setExInviteExhibitionRules(data.exhibition_rules ?? "");

      if (data.status === "accepted") {
        setExInviteStatus("accepted");
        return;
      }
      if (data.status === "revoked") {
        setExInviteStatus("revoked");
        return;
      }
      if (data.status === "expired" || new Date(data.expires_at) < new Date()) {
        setExInviteStatus("expired");
        return;
      }

      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser && signedInUser.email?.toLowerCase() === data.email.toLowerCase()) {
        setExInviteStatus("ready_signed_in");
      } else {
        setExInviteStatus("ready");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibitionInviteToken]);

  // ── Helpers ───────────────────────────────────────────────────
  const pickSide = (s: Side) => {
    setSide(s);
    setError(null);
    setForgotSent(false);
  };

  const withLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    await fn();
    setLoading(false);
  };

  // An invite token in the URL has to survive whichever sign-in path the
  // visitor takes (password on either tab, or Google), not just the invite
  // form's own sign-up.
  const pendingInviteParams = inviteToken
    ? `&invite=${inviteToken}`
    : exhibitionInviteToken
      ? `&exhibition_invite=${exhibitionInviteToken}`
      : "";

  const redeemPendingInvites = async (): Promise<string | null> => {
    if (inviteToken) {
      const { error } = await supabase.rpc("accept_artist_invite", { p_token: inviteToken });
      if (error) return error.message;
    }
    if (exhibitionInviteToken) {
      const { error } = await supabase.rpc("accept_exhibition_invite", { p_token: exhibitionInviteToken });
      if (error) return error.message;
    }
    return null;
  };

  // The email already has an account (e.g. a gallery owner invited as an
  // artist): signUp can't create it again, so route them to sign in with the
  // invite token still in the URL.
  const redirectExistingAccountToSignIn = (email: string) => {
    setArtistEmail(email);
    setAView("signin");
    setError("You already have an account with this email — sign in to accept the invite.");
  };

  // ── Gallery handlers ──────────────────────────────────────────
  const handleGallerySignIn = () =>
    withLoad(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: gEmail, password: gPassword });
      if (error) { setError(error.message); return; }
      if (pendingInviteParams) {
        const inviteError = await redeemPendingInvites();
        if (inviteError) { setError(inviteError); return; }
        router.push("/studio");
        router.refresh();
        return;
      }
      // Keep the transition on screen through the navigation — the sign-in
      // form would otherwise flash back to its idle state before /dashboard
      // has finished loading.
      setRedirecting(true);
      router.push("/dashboard");
      router.refresh();
    });

  const handleGallerySignUp = () =>
    withLoad(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { role: "gallery", gallery_name: signupGalleryName, full_name: signupFullName, city: signupCity },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) { setError(error.message); return; }
      if (!data.session) {
        // Email confirmation required before a session exists.
        setToast(`Check your email — we sent a confirmation link to ${signupEmail}.`);
        setGEmail(signupEmail);
        setGView("signin");
        return;
      }
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

  const handleOAuth = async (provider: "google") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?role=gallery${pendingInviteParams}` },
    });
  };

  // ── Artist handlers ───────────────────────────────────────────
  const handleArtistSignIn = () =>
    withLoad(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: artistEmail, password: artistPassword });
      if (error) { setError(error.message); return; }
      const inviteError = await redeemPendingInvites();
      if (inviteError) { setError(inviteError); return; }

      // A gallery owner signing in on the artist tab gets an artist profile
      // on the same account (RLS lets users insert their own row).
      const { data: profile } = await supabase.from("artist_profiles").select("id").eq("id", data.user.id).maybeSingle();
      if (!profile) {
        const meta = data.user.user_metadata as { full_name?: string; practice?: string; city?: string };
        const { error: profileError } = await supabase
          .from("artist_profiles")
          .insert({ id: data.user.id, full_name: meta.full_name ?? null, practice: meta.practice ?? null, city: meta.city ?? null });
        if (profileError) { setError(profileError.message); return; }
      }
      router.push("/studio");
      router.refresh();
    });

  const handleArtistForgotPassword = () =>
    withLoad(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/update-password`,
      });
      if (error) { setError(error.message); return; }
      setForgotSent(true);
    });

  const handleArtistOAuth = async (provider: "google") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?role=artist${pendingInviteParams}` },
    });
  };

  // ── Invite handlers ───────────────────────────────────────────
  const handleInviteOAuth = async (provider: "google") => {
    if (!inviteToken) return;
    if (!inviteAgreed) { setError("Please agree to the terms to continue."); return; }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/studio&invite=${inviteToken}`,
      },
    });
  };

  const handleInviteAccept = () =>
    withLoad(async () => {
      if (!inviteToken) return;

      if (inviteStatus === "ready_signed_in") {
        const { error: acceptError } = await supabase.rpc("accept_artist_invite", { p_token: inviteToken });
        if (acceptError) { setError(acceptError.message); return; }
        router.push("/studio");
        router.refresh();
        return;
      }

      if (!inviteAgreed) { setError("Please agree to the terms to continue."); return; }
      if (invitePassword.length < 6) { setError("Choose a password with at least 6 characters."); return; }

      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: invitePassword,
        options: {
          data: { role: "artist", full_name: inviteName, practice: invitePractice, city: inviteCity },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/studio&invite=${inviteToken}`,
        },
      });
      if (error) { setError(error.message); return; }

      // Supabase hides "already registered" behind a user with no identities.
      if (data.user?.identities?.length === 0) { redirectExistingAccountToSignIn(inviteEmail); return; }

      if (!data.session) {
        // Email confirmation required before a session exists — the invite
        // gets redeemed once they click through in auth/callback.
        setInviteConfirmationPending(true);
        return;
      }

      const { error: acceptError } = await supabase.rpc("accept_artist_invite", { p_token: inviteToken });
      if (acceptError) { setError(acceptError.message); return; }

      router.push("/studio");
      router.refresh();
    });

  const handleExhibitionInviteOAuth = async (provider: "google") => {
    if (!exhibitionInviteToken) return;
    if (!exInviteAgreed) { setError("Please agree to the terms to continue."); return; }
    if (exInviteExhibitionRules && !exInviteRulesAck) { setError("Please confirm you've read the exhibition rules."); return; }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/studio&exhibition_invite=${exhibitionInviteToken}`,
      },
    });
  };

  const handleExhibitionInviteAccept = () =>
    withLoad(async () => {
      if (!exhibitionInviteToken) return;

      if (exInviteStatus === "ready_signed_in") {
        if (exInviteExhibitionRules && !exInviteRulesAck) { setError("Please confirm you've read the exhibition rules."); return; }
        const { error: acceptError } = await supabase.rpc("accept_exhibition_invite", { p_token: exhibitionInviteToken });
        if (acceptError) { setError(acceptError.message); return; }
        router.push("/studio");
        router.refresh();
        return;
      }

      if (!exInviteAgreed) { setError("Please agree to the terms to continue."); return; }
      if (exInviteExhibitionRules && !exInviteRulesAck) { setError("Please confirm you've read the exhibition rules."); return; }
      if (exInvitePassword.length < 6) { setError("Choose a password with at least 6 characters."); return; }

      const { data, error } = await supabase.auth.signUp({
        email: exInviteEmail,
        password: exInvitePassword,
        options: {
          data: { role: "artist", full_name: exInviteName, practice: exInvitePractice, city: exInviteCity },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/studio&exhibition_invite=${exhibitionInviteToken}`,
        },
      });
      if (error) { setError(error.message); return; }

      if (data.user?.identities?.length === 0) { redirectExistingAccountToSignIn(exInviteEmail); return; }

      if (!data.session) {
        setExInviteConfirmationPending(true);
        return;
      }

      const { error: acceptError } = await supabase.rpc("accept_exhibition_invite", { p_token: exhibitionInviteToken });
      if (acceptError) { setError(acceptError.message); return; }

      router.push("/studio");
      router.refresh();
    });

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
            Woza Art
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
              email={artistEmail} password={artistPassword} loading={loading}
              onEmail={setArtistEmail} onPassword={setArtistPassword}
              onSubmit={handleArtistSignIn}
              onForgot={() => { setAView("forgot"); setError(null); }}
              onInvite={() => { setAView("invite"); setError(null); }}
              onOAuth={handleArtistOAuth} onError={setError}
            />
          )}

          {!isGallery && aView === "forgot" && (
            <ArtistForms.Forgot
              email={forgotEmail} sent={forgotSent} loading={loading}
              onEmail={setForgotEmail} onSubmit={handleArtistForgotPassword}
              onBack={() => { setAView("signin"); setForgotSent(false); setError(null); }}
              onError={setError}
            />
          )}

          {!isGallery && aView === "invite" && (
            <ArtistForms.Invite
              status={inviteStatus} galleryName={inviteGalleryName}
              email={inviteEmail} name={inviteName} practice={invitePractice} city={inviteCity}
              password={invitePassword} agreed={inviteAgreed} confirmationPending={inviteConfirmationPending}
              loading={loading}
              onName={setInviteName} onPractice={setInvitePractice}
              onCity={setInviteCity} onPassword={setInvitePassword} onAgreed={setInviteAgreed}
              onSubmit={handleInviteAccept}
              onOAuth={handleInviteOAuth}
              onSignIn={() => { setAView("signin"); setError(null); }}
              onError={setError}
            />
          )}

          {!isGallery && aView === "exhibition-invite" && (
            <ArtistForms.ExhibitionInvite
              status={exInviteStatus} galleryName={exInviteGalleryName}
              exhibitionTitle={exInviteExhibitionTitle} exhibitionTheme={exInviteExhibitionTheme} exhibitionRules={exInviteExhibitionRules}
              email={exInviteEmail} name={exInviteName} practice={exInvitePractice} city={exInviteCity}
              password={exInvitePassword} agreed={exInviteAgreed} rulesAck={exInviteRulesAck} confirmationPending={exInviteConfirmationPending}
              loading={loading}
              onName={setExInviteName} onPractice={setExInvitePractice}
              onCity={setExInviteCity} onPassword={setExInvitePassword} onAgreed={setExInviteAgreed} onRulesAck={setExInviteRulesAck}
              onSubmit={handleExhibitionInviteAccept}
              onOAuth={handleExhibitionInviteOAuth}
              onSignIn={() => { setAView("signin"); setError(null); }}
              onError={setError}
            />
          )}

        </div>
      </div>

      {redirecting && <RedirectingTransition />}

      {toast && (
        <div
          role="status"
          className="anim-toast"
          style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--pl-surface-dark)", color: "var(--pl-on-dark)", padding: "13px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, zIndex: 60, width: "max-content", maxWidth: "calc(100vw - 32px)", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Post-sign-in transition ──────────────────────────────────────

function RedirectingTransition() {
  return (
    <div
      className="anim-scrim fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
      style={{ background: "linear-gradient(150deg,#F4F1EA,#EAE5D9)" }}
    >
      <div className="anim-pop flex flex-col items-center gap-5">
        <span className="inline-flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-[-0.01em] text-[#17150F]">
            Woza Art
          </span>
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--pl-accent)] block translate-y-[-2px]" />
        </span>
        <span
          className="anim-spin w-6 h-6 rounded-full border-2 border-[rgba(23,21,15,.15)]"
          style={{ borderTopColor: "#17150F" }}
        />
        <p className="text-[13.5px] text-text-muted">Opening your dashboard…</p>
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
