-- Research responses: answers to the short user-research forms at
-- /forms/<slug> (one form per idea being validated). Same shape as
-- consignment_terms_responses: the respondent has no account, so anyone may
-- insert, nobody can read through the public API, and the platform owner
-- reads responses in the app or the Supabase dashboard.
--
-- `answers` is JSON keyed by question id from lib/research-forms.ts, so
-- questions can change without a migration.

create table public.research_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  form_slug text not null check (char_length(form_slug) between 1 and 100),
  respondent_name text not null check (char_length(respondent_name) between 1 and 200),
  respondent_role text not null check (respondent_role in ('artist', 'gallery', 'both', 'other')),
  respondent_email text check (char_length(respondent_email) <= 200),
  answers jsonb not null
    check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 16000)
);

create index research_responses_form_slug_idx on public.research_responses(form_slug);

alter table public.research_responses enable row level security;

create policy "research_responses_insert_public" on public.research_responses
  for insert to anon, authenticated
  with check (true);

create policy "research_responses_select_owner" on public.research_responses
  for select to authenticated
  using (public.is_platform_owner());

revoke all on public.research_responses from anon, authenticated;
grant insert on public.research_responses to anon, authenticated;
grant select on public.research_responses to authenticated;
