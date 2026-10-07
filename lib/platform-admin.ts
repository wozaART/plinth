// The one person who can see consignment-terms responses and send
// follow-ups — these respondents are prospects, not gallery tenants, so
// there's no owns_gallery()-style check for them. Keep this in sync with
// public.is_platform_owner() in
// supabase/migrations/20261008130000_consignment_terms_followups.sql.
export const PLATFORM_ADMIN_EMAIL = "debruyn.sarel@gmail.com";
