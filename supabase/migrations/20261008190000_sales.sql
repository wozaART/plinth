-- Phase 2 ("recording a sale"): a `sales` table capturing what a catalogue
-- work sold for, the commission split at the time of sale (so later changes
-- to a gallery's or work's commission rate don't rewrite history), and the
-- buyer/payout bookkeeping the gallery needs to track. Money is stored as
-- integer cents throughout, unlike the numeric(12,2) rand amounts elsewhere
-- in this schema, per the phase brief.

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  catalogue_work_id uuid not null references public.catalogue_works(id) on delete restrict,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  sale_price_cents integer not null check (sale_price_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  commission_rate numeric(4,3) not null check (commission_rate >= 0 and commission_rate <= 1),
  commission_amount_cents integer not null check (commission_amount_cents >= 0),
  artist_amount_cents integer not null check (artist_amount_cents >= 0),
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  sold_at date not null default current_date,
  buyer_paid_at date,
  payout_due_at date,
  created_at timestamptz not null default now()
);

create index sales_gallery_id_idx on public.sales(gallery_id);
create index sales_artist_id_idx on public.sales(artist_id);
create index sales_catalogue_work_id_idx on public.sales(catalogue_work_id);

-- ── record_sale ─────────────────────────────────────────────────────────
-- Inserts the sale and flips the work to `sold` in one transaction, so a
-- half-recorded sale (row inserted, work still `available`) can't happen.
-- Security definer, like submissions_update_artist_ack: the gallery-owner
-- check happens inside the function instead of relying on separate INSERT/
-- UPDATE RLS policies across two tables.

create or replace function public.record_sale(
  p_catalogue_work_id uuid,
  p_sale_price_cents integer,
  p_discount_cents integer default 0,
  p_commission_rate numeric default null,
  p_buyer_name text default null,
  p_buyer_email text default null,
  p_buyer_phone text default null,
  p_sold_at date default current_date,
  p_buyer_paid_at date default null,
  p_payout_due_at date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  work record;
  v_commission_rate numeric(4,3);
  v_net_cents integer;
  v_commission_amount_cents integer;
  v_artist_amount_cents integer;
  v_sale_id uuid;
begin
  select cw.gallery_id, cw.artist_id, cw.commission_rate, cw.status
  into work
  from public.catalogue_works cw
  where cw.id = p_catalogue_work_id
  for update;

  if not found or not public.owns_gallery(work.gallery_id) then
    raise exception 'This work could not be found.';
  end if;

  if work.status = 'sold' then
    raise exception 'This work has already been marked as sold.';
  end if;

  if p_sale_price_cents < p_discount_cents then
    raise exception 'The discount cannot exceed the sale price.';
  end if;

  v_commission_rate := coalesce(
    p_commission_rate,
    work.commission_rate,
    (select g.commission_rate from public.galleries g where g.id = work.gallery_id)
  );

  v_net_cents := p_sale_price_cents - p_discount_cents;
  v_commission_amount_cents := round(v_net_cents * v_commission_rate);
  v_artist_amount_cents := v_net_cents - v_commission_amount_cents;

  insert into public.sales (
    gallery_id, catalogue_work_id, artist_id,
    sale_price_cents, discount_cents, commission_rate,
    commission_amount_cents, artist_amount_cents,
    buyer_name, buyer_email, buyer_phone,
    sold_at, buyer_paid_at, payout_due_at
  ) values (
    work.gallery_id, p_catalogue_work_id, work.artist_id,
    p_sale_price_cents, p_discount_cents, v_commission_rate,
    v_commission_amount_cents, v_artist_amount_cents,
    p_buyer_name, p_buyer_email, p_buyer_phone,
    p_sold_at, p_buyer_paid_at, p_payout_due_at
  )
  returning id into v_sale_id;

  update public.catalogue_works set status = 'sold' where id = p_catalogue_work_id;

  return v_sale_id;
end;
$$;

grant execute on function public.record_sale(uuid, integer, integer, numeric, text, text, text, date, date, date) to authenticated;

-- ── Artist view: no buyer identity ─────────────────────────────────────
-- Everything an artist needs to track a sale of their own work, minus who
-- bought it.

create view public.artist_sales
with (security_invoker = true) as
select
  id, gallery_id, catalogue_work_id, artist_id,
  sale_price_cents, discount_cents, commission_rate,
  commission_amount_cents, artist_amount_cents,
  sold_at, buyer_paid_at, payout_due_at, created_at
from public.sales;

-- ── RLS ─────────────────────────────────────────────────────────────────

alter table public.sales enable row level security;

create policy "sales_select_owner" on public.sales
  for select to authenticated using (public.owns_gallery(gallery_id));

-- Row-level only — artist_sales is the column-safe path artists should
-- query; this policy also governs it, since the view runs with the
-- caller's own privileges (security_invoker).
create policy "sales_select_artist" on public.sales
  for select to authenticated using (artist_id = (select auth.uid()));
