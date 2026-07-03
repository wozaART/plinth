import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const PROTECTED = ["/dashboard", "/studio"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/signin" && !request.nextUrl.searchParams.has("invite")) {
    const role = (user.user_metadata as { role?: string })?.role;
    const url = request.nextUrl.clone();
    url.pathname = role === "artist" ? "/studio" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
