import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { isDemoUser } from "@/lib/demo";
import { DEMO_BACK_COOKIE, safeBackPath } from "@/lib/demo-brand";
import { createClient } from "@/utils/supabase/server";

// Leaves the demo: signs the demo account out (never a real user) and sends
// the visitor back to the page they entered from.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (isDemoUser(user)) await supabase.auth.signOut();

  const url = request.nextUrl.clone();
  const [pathname, search = ""] = safeBackPath(cookieStore.get(DEMO_BACK_COOKIE)?.value).split("?");
  url.pathname = pathname;
  url.search = search ? `?${search}` : "";
  const response = NextResponse.redirect(url);
  response.cookies.delete(DEMO_BACK_COOKIE);
  return response;
}
