import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { DEMO_BACK_COOKIE } from "@/lib/demo-brand";

// One-tap demo access for the marketing site. The demo accounts' credentials
// live in server-side env vars (never shipped to the client): the route signs
// in as the matching account, which sets the normal Supabase session cookies,
// then redirects into the portal.
const DEMOS = {
  gallery: { emailVar: "DEMO_GALLERY_EMAIL", destination: "/dashboard" },
  artist: { emailVar: "DEMO_ARTIST_EMAIL", destination: "/studio" },
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role } = await params;
  if (!(role in DEMOS)) return new NextResponse("Not found", { status: 404 });
  const demo = DEMOS[role as keyof typeof DEMOS];

  const email = process.env[demo.emailVar];
  const password = process.env.DEMO_PASSWORD;
  const fail = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "?error=The demo is unavailable right now.";
    return NextResponse.redirect(url);
  };
  if (!email || !password) return fail();

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail();

  const url = request.nextUrl.clone();
  url.pathname = demo.destination;
  url.search = "";
  const response = NextResponse.redirect(url);

  // Remember where the visitor came from (same-origin pages only) so the demo
  // portals can offer a way back.
  const referer = request.headers.get("referer");
  let back = "/";
  if (referer) {
    try {
      const from = new URL(referer);
      if (from.origin === request.nextUrl.origin && !from.pathname.startsWith("/demo")) back = from.pathname === "/review" ? "/review?step=preview" : from.pathname;
    } catch {}
  }
  response.cookies.set(DEMO_BACK_COOKIE, back, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 });
  return response;
}
