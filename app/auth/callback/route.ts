import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as string | null;
  const next = searchParams.get("next") ?? "/";
  // Same-origin paths only, so `next` can't be used as an open redirect.
  const requestedNext = /^\/(?![/\\])/.test(next) && searchParams.has("next") ? next : null;
  const invite = searchParams.get("invite");
  const exhibitionInvite = searchParams.get("exhibition_invite");
  const roleParam = searchParams.get("role");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  // A session established below (OAuth code exchange or email-confirmation
  // token) may belong to someone redeeming a gallery's artist invite. Redeem
  // it now, while we still have the request's `invite` token, rather than
  // asking the client to do it after the redirect.
  async function redeemInviteIfPresent(): Promise<string | null> {
    if (!invite) return null;
    const { error } = await supabase.rpc("accept_artist_invite", { p_token: invite });
    return error?.message ?? null;
  }

  async function redeemExhibitionInviteIfPresent(): Promise<string | null> {
    if (!exhibitionInvite) return null;
    const { error } = await supabase.rpc("accept_exhibition_invite", { p_token: exhibitionInvite });
    return error?.message ?? null;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const inviteError = await redeemInviteIfPresent();
      if (inviteError) {
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(inviteError)}`);
      }
      const exhibitionInviteError = await redeemExhibitionInviteIfPresent();
      if (exhibitionInviteError) {
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(exhibitionInviteError)}`);
      }
      const existingRole = (data.user.user_metadata as { role?: string })?.role;
      const role = invite || exhibitionInvite ? "artist" : roleParam ?? existingRole;
      if (!existingRole && role) {
        await supabase.auth.updateUser({ data: { role } });
      }
      // Gallery sign-in for an account with no gallery: don't strand them on a
      // dashboard they can't open.
      if (roleParam === "gallery" && !invite && !exhibitionInvite && existingRole === "artist") {
        const { data: owned } = await supabase.from("galleries").select("id").eq("owner_id", data.user.id).maybeSingle();
        if (!owned) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/signin?notice=no-gallery`);
        }
      }
      return NextResponse.redirect(`${origin}${requestedNext ?? (role === "artist" ? "/studio" : "/dashboard")}`);
    }
  }

  if (token_hash && type) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
    if (!error) {
      const inviteError = await redeemInviteIfPresent();
      if (inviteError) {
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(inviteError)}`);
      }
      const exhibitionInviteError = await redeemExhibitionInviteIfPresent();
      if (exhibitionInviteError) {
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(exhibitionInviteError)}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
