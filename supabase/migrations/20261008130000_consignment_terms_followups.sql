-- Lets the platform owner (not a gallery owner — these respondents aren't
-- tenants yet) read consignment_terms_responses and log follow-ups sent to
-- a respondent. See lib/platform-admin.ts for the single source of truth
-- on who the platform owner is; keep that file and is_platform_owner() in
-- sync if the owner's email ever changes.

alter table public.consignment_terms_responses
  add column contact_email text check (char_length(contact_email) <= 200),
  add column status text not null default 'new' check (status in ('new', 'reviewed'));

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.jwt() ->> 'email') = 'debruyn.sarel@gmail.com';
$$;

grant execute on function public.is_platform_owner() to authenticated;

create policy "consignment_terms_responses_select_owner" on public.consignment_terms_responses
  for select to authenticated
  using (public.is_platform_owner());

create policy "consignment_terms_responses_update_owner" on public.consignment_terms_responses
  for update to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

grant select, update on public.consignment_terms_responses to authenticated;

create table public.consignment_terms_followups (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.consignment_terms_responses(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete set null
);

create index consignment_terms_followups_response_id_idx on public.consignment_terms_followups(response_id);

alter table public.consignment_terms_followups enable row level security;

create policy "consignment_terms_followups_select_owner" on public.consignment_terms_followups
  for select to authenticated
  using (public.is_platform_owner());

create policy "consignment_terms_followups_insert_owner" on public.consignment_terms_followups
  for insert to authenticated
  with check (public.is_platform_owner() and created_by = (select auth.uid()));

grant select, insert on public.consignment_terms_followups to authenticated;
