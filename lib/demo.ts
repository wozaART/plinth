// Every seeded demo account (see supabase/seed.sql) lives under this domain,
// which is reserved and can never receive real mail. Server actions check it
// to skip outbound side effects — Supabase edge functions (emails) and Vercel
// domain calls — while leaving the UI fully usable for demo visitors.
export const DEMO_EMAIL_SUFFIX = "demo.wozaart.test";

export function isDemoUser(user: { email?: string | null } | null | undefined): boolean {
  const email = user?.email?.toLowerCase();
  return !!email && (email === DEMO_EMAIL_SUFFIX || email.endsWith(`.${DEMO_EMAIL_SUFFIX}`) || email.endsWith(`@${DEMO_EMAIL_SUFFIX}`));
}
