-- Move bank details off `artist_profiles` into their own artist-only table.
-- `artist_profiles_select_by_gallery` lets a gallery see an artist's profile
-- row once they have a submission/message together; RLS is row-level, not
-- column-level, so bank columns on that table were readable by any such
-- gallery despite the original comment saying otherwise. Bank data now lives
-- here, with no gallery-facing select policy at all, plus one narrow
-- security-definer function a gallery can call to pay out an artist it has
-- actually sold work for.

create table public.artist_bank_details (
  id uuid primary key references public.artist_profiles(id) on delete cascade,
  bank_name text,
  bank_account_number text,
  branch_code text,
  account_type text,
  updated_at timestamptz not null default now()
);

insert into public.artist_bank_details (id, bank_name, bank_account_number, branch_code, account_type)
select id, bank_name, bank_account_number, branch_code, account_type from public.artist_profiles;

alter table public.artist_profiles
  drop column bank_name,
  drop column bank_account_number,
  drop column branch_code,
  drop column account_type;

create trigger artist_bank_details_set_updated_at
  before update on public.artist_bank_details
  for each row execute function public.set_updated_at();

alter table public.artist_bank_details enable row level security;

create policy "artist_bank_details_select_own" on public.artist_bank_details
  for select to authenticated
  using (id = (select auth.uid()));

create policy "artist_bank_details_insert_own" on public.artist_bank_details
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "artist_bank_details_update_own" on public.artist_bank_details
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Narrow payout read: a gallery owner may read an artist's bank details only
-- when that artist has a sold catalogue work belonging to that gallery.
create or replace function public.get_artist_bank_details_for_payout(target_artist_id uuid)
returns table (
  bank_name text,
  bank_account_number text,
  branch_code text,
  account_type text
)
language sql
stable
security definer
set search_path = public
as $$
  select b.bank_name, b.bank_account_number, b.branch_code, b.account_type
  from public.artist_bank_details b
  where b.id = target_artist_id
    and exists (
      select 1 from public.catalogue_works c
      where c.artist_id = target_artist_id
        and c.status = 'sold'
        and public.owns_gallery(c.gallery_id)
    );
$$;

grant execute on function public.get_artist_bank_details_for_payout(uuid) to authenticated;
