-- Phase 3 ("payouts and the acknowledgement loop"): a `payouts` table that
-- tracks, per sale, what the gallery owes the artist and where that stands —
-- due, paid, acknowledged by the artist, or queried by the artist. One
-- payout row is created automatically for every sale (mirroring how
-- record_sale() already derives the artist's cut), so the gallery never has
-- to remember to create one by hand.

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  sale_id uuid not null unique references public.sales(id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'due' check (status in ('due', 'paid', 'acknowledged', 'queried')),
  paid_at date,
  payment_reference text,
  proof_of_payment_path text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index payouts_gallery_id_idx on public.payouts(gallery_id);
create index payouts_artist_id_idx on public.payouts(artist_id);

-- ── Auto-create a payout when a sale is recorded ────────────────────────

create or replace function public.create_payout_for_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.payouts (gallery_id, sale_id, artist_id, amount_cents)
  values (new.gallery_id, new.id, new.artist_id, new.artist_amount_cents);
  return new;
end;
$$;

create trigger sales_create_payout
  after insert on public.sales
  for each row execute function public.create_payout_for_sale();

-- ── mark_payout_paid ─────────────────────────────────────────────────────
-- Gallery-side: flips a payout to `paid`, recording the payment reference
-- and (optionally) the storage path of an uploaded proof of payment.
-- Security definer, like record_sale, so the owns_gallery check happens
-- inside the function rather than via a table-wide UPDATE policy.

create or replace function public.mark_payout_paid(
  p_payout_id uuid,
  p_paid_at date default current_date,
  p_payment_reference text default null,
  p_proof_of_payment_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gallery_id uuid;
begin
  select gallery_id into v_gallery_id from public.payouts where id = p_payout_id for update;

  if not found or not public.owns_gallery(v_gallery_id) then
    raise exception 'This payout could not be found.';
  end if;

  update public.payouts
  set status = 'paid',
      paid_at = p_paid_at,
      payment_reference = p_payment_reference,
      proof_of_payment_path = coalesce(p_proof_of_payment_path, proof_of_payment_path)
  where id = p_payout_id;
end;
$$;

grant execute on function public.mark_payout_paid(uuid, date, text, text) to authenticated;

-- ── acknowledge_payout / query_payout ────────────────────────────────────
-- Artist-side, each changing only its own columns, copying the pattern from
-- submissions_update_artist_ack: security definer, scoped to the calling
-- artist, and only once the gallery has actually marked the payout paid.

create or replace function public.acknowledge_payout(p_payout_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payouts
  set status = 'acknowledged',
      acknowledged_at = now()
  where id = p_payout_id
    and artist_id = (select auth.uid())
    and status = 'paid';

  if not found then
    raise exception 'This payout could not be acknowledged.';
  end if;
end;
$$;

grant execute on function public.acknowledge_payout(uuid) to authenticated;

create or replace function public.query_payout(p_payout_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payouts
  set status = 'queried'
  where id = p_payout_id
    and artist_id = (select auth.uid())
    and status = 'paid';

  if not found then
    raise exception 'This payout could not be queried.';
  end if;
end;
$$;

grant execute on function public.query_payout(uuid) to authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────
-- Row-level only — all writes happen through the trigger and the
-- security-definer functions above, so there are no insert/update policies.

alter table public.payouts enable row level security;

create policy "payouts_select_owner" on public.payouts
  for select to authenticated using (public.owns_gallery(gallery_id));

create policy "payouts_select_artist" on public.payouts
  for select to authenticated using (artist_id = (select auth.uid()));

-- ── Storage: proof of payment ───────────────────────────────────────────
-- Path convention: {gallery_id}/{payout_id}/{filename}. Unlike
-- submission-images, this bucket is private: a payment reference document
-- can contain bank details, so only the paying gallery and the paid artist
-- may read it. The artist has no folder of their own to be scoped to (the
-- path is gallery-owned), so their read policy instead joins back to the
-- payouts row that recorded this exact path.

insert into storage.buckets (id, name, public, file_size_limit)
values ('payout-proofs', 'payout-proofs', false, 10485760)
on conflict (id) do nothing;

create policy "payout_proofs_select_owner" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payout-proofs'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

create policy "payout_proofs_select_artist" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payout-proofs'
    and exists (
      select 1 from public.payouts p
      where p.proof_of_payment_path = storage.objects.name
        and p.artist_id = (select auth.uid())
    )
  );

create policy "payout_proofs_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payout-proofs'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

create policy "payout_proofs_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'payout-proofs'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

create policy "payout_proofs_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'payout-proofs'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

-- ── Register the new tabs ────────────────────────────────────────────────

update public.galleries
set gallery_tabs = gallery_tabs || '[{"id":"payouts","label":"Payouts","enabled":true}]'::jsonb
where not exists (
  select 1 from jsonb_array_elements(gallery_tabs) t where t->>'id' = 'payouts'
);

update public.galleries
set studio_tabs = studio_tabs || '[{"id":"earnings","label":"Earnings","enabled":true}]'::jsonb
where not exists (
  select 1 from jsonb_array_elements(studio_tabs) t where t->>'id' = 'earnings'
);
