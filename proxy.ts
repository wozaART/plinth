import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const PROTECTED = ["/dashboard", "/studio"];

const DEFAULT_GALLERY_SLUG = process.env.DEFAULT_GALLERY_SLUG ?? "default";
const APEX_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_APEX_DOMAIN;

/**
 * Resolves which gallery a request belongs to from its host header, so one
 * deployment can serve every gallery instead of each gallery needing its
 * own build/deploy. Order: a verified custom domain, then the
 * <slug>.<apex> subdomain pattern, then the platform default.
 */
async function resolveGallerySlug(host: string | null): Promise<string> {
  if (!host) return DEFAULT_GALLERY_SLUG;
  const bareHost = host.split(":")[0];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("galleries")
      .select("slug")
      .eq("custom_domain", bareHost)
      .eq("domain_status", "verified")
      .maybeSingle();
    if (data) return data.slug;
  }

  if (APEX_DOMAIN && bareHost.endsWith(`.${APEX_DOMAIN}`)) {
    const candidate = bareHost.slice(0, -(APEX_DOMAIN.length + 1));
    if (candidate && !candidate.includes(".")) return candidate;
  }

  return DEFAULT_GALLERY_SLUG;
}

export async function proxy(request: NextRequest) {
  const gallerySlug = await resolveGallerySlug(request.headers.get("host"));
  request.headers.set("x-gallery-slug", gallerySlug);

  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    pathname === "/signin" &&
    !request.nextUrl.searchParams.has("invite") &&
    !request.nextUrl.searchParams.has("exhibition_invite")
  ) {
    const role = (user.user_metadata as { role?: string })?.role;
    // `role` only records the account's first role, so a dual account that
    // started as an artist would otherwise always land in the studio.
    let toStudio = role === "artist";
    if (toStudio) {
      const { data: owned } = await supabase.from("galleries").select("id").eq("owner_id", user.id).maybeSingle();
      if (owned) toStudio = false;
    }
    const url = request.nextUrl.clone();
    url.pathname = toStudio ? "/studio" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
