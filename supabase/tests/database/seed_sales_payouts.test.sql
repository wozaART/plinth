-- Guards the demo seed (supabase/seed.sql): both tenants must have sales and
-- payouts in every payout status, so manual QA and tests have data to use.
-- Runs against the seeded database and rolls back; it writes nothing.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

select results_eq(
  $$ select g.slug, p.status
     from public.payouts p join public.galleries g on g.id = p.gallery_id
     where g.slug in ('jvh', 'default')
     group by g.slug, p.status
     order by g.slug, p.status $$,
  $$ values
       ('default'::text, 'acknowledged'::text), ('default', 'due'), ('default', 'paid'), ('default', 'queried'),
       ('jvh', 'acknowledged'), ('jvh', 'due'), ('jvh', 'paid'), ('jvh', 'queried') $$,
  'both seeded tenants have payouts in every status'
);

select is(
  (select count(*)::int from public.sales s
   where not exists (select 1 from public.payouts p where p.sale_id = s.id and p.amount_cents = s.artist_amount_cents)),
  0,
  'every seeded sale has a payout for the artist amount'
);

select is(
  (select count(*)::int from public.sales s
   where s.commission_amount_cents + s.artist_amount_cents <> s.sale_price_cents - s.discount_cents),
  0,
  'seeded sale splits add up to the net price'
);

select is(
  (select count(*)::int from public.sales s join public.catalogue_works w on w.id = s.catalogue_work_id where w.status <> 'sold'),
  0,
  'every seeded sale is for a work marked sold'
);

select * from finish();
rollback;
