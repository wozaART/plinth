-- Artists must not read buyer identity. sales_select_artist gave them row
-- access to public.sales, buyer_name/email/phone included, and column grants
-- can't separate owners from artists (both are `authenticated`). Drop the
-- policy and serve artists only through artist_sales, which now runs with its
-- owner's privileges and filters to the caller's own rows itself.

drop policy "sales_select_artist" on public.sales;

create or replace view public.artist_sales
with (security_invoker = false) as
select
  id, gallery_id, catalogue_work_id, artist_id,
  sale_price_cents, discount_cents, commission_rate,
  commission_amount_cents, artist_amount_cents,
  sold_at, buyer_paid_at, payout_due_at, created_at
from public.sales
where artist_id = (select auth.uid());

revoke all on public.artist_sales from anon, public;
grant select on public.artist_sales to authenticated;
