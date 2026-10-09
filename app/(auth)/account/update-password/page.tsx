"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { AuthHeading, AuthInput, ErrorBanner, Eyebrow, FieldLabel, PrimaryButton } from "@/components/auth/primitives";

// Landing page for password-reset links (see /auth/callback?next=...). The
// callback has already exchanged the emailed code for a session, so this only
// needs to set the new password on that session.
export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState<"checking" | "yes" | "no">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setReady(user ? "yes" : "no"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (password.length < 6) { setError("Choose a password with at least 6 characters."); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setLoading(true);
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    const role = (data.user.user_metadata as { role?: string })?.role;
    router.push(role === "artist" ? "/studio" : "/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-[var(--pl-bg)]" style={{ padding: "clamp(36px,5vw,64px) clamp(22px,4vw,44px)" }}>
      <div className="w-full max-w-[392px] anim-fade">
        <Eyebrow>Reset password</Eyebrow>

        {ready === "no" ? (
          <>
            <AuthHeading>This link has expired.</AuthHeading>
            <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-6">
              Password reset links work once and expire after 30 minutes. Request a new one from the sign-in page.
            </p>
            <Link href="/signin">
              <PrimaryButton className="!mt-0">Back to sign in</PrimaryButton>
            </Link>
          </>
        ) : (
          <>
            <AuthHeading>Choose a new password.</AuthHeading>
            <p className="text-[14px] text-text-muted leading-relaxed mt-[11px] mb-[26px]">
              You&apos;ll be signed in as soon as it&apos;s saved.
            </p>
            {error && <ErrorBanner message={error} />}
            <FieldLabel>New password</FieldLabel>
            <AuthInput
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
            />
            <div className="mt-4">
              <FieldLabel>Confirm password</FieldLabel>
              <AuthInput
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              />
            </div>
            <PrimaryButton loading={loading || ready === "checking"} onClick={handleSubmit}>
              {loading ? "Saving…" : "Save password"}
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}
