-- Consignment terms responses: answers a prospective partner gallery gives
-- on the public /consignment-terms form (commission, payout timing, who
-- absorbs discounts, VAT). They inform the sales/payouts schema.
--
-- The respondent has no Plinth account, so the row is not tied to a tenant
-- and anyone may insert. Nobody can read through the API: there is no select
-- policy, so responses are read in the Supabase dashboard (service role).
--
-- `answers` is JSON keyed by question id from lib/consignment-terms.ts, so
-- questions can change without a migration.

create table public.consignment_terms_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  gallery_name text not null check (char_length(gallery_name) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 200),
  contact_role text check (char_length(contact_role) <= 200),
  answers jsonb not null
    check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 16000)
);

alter table public.consignment_terms_responses enable row level security;

create policy "consignment_terms_responses_insert_public" on public.consignment_terms_responses
  for insert to anon, authenticated
  with check (true);

revoke all on public.consignment_terms_responses from anon, authenticated;
grant insert on public.consignment_terms_responses to anon, authenticated;
