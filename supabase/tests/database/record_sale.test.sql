begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ── Fixtures ────────────────────────────────────────────────────────────
-- Two galleries (owners ga/gb), two artists (a1/a2). Inserting into
-- auth.users fires handle_new_user, which creates the gallery/profile rows.
-- Ids are fixed so assertions can name them.

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@test.local', '{"role":"gallery","gallery_name":"Gallery A"}'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@test.local', '{"role":"gallery","gallery_name":"Gallery B"}'),
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist1@test.local', '{"role":"artist","full_name":"Artist One"}'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist2@test.local', '{"role":"artist","full_name":"Artist Two"}');

create schema tests;
grant usage on schema tests to public;

-- Switch to a signed-in user (or to anon when called with null). `set local`
-- semantics: lasts until the end of the test transaction or `reset role`.
create function tests.act_as(uid uuid) returns void language plpgsql as $$
begin
  if uid is null then
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
end $$;
grant execute on function tests.act_as(uuid) to public;

create function tests.gallery_of(owner uuid) returns uuid language sql as
  $$ select id from public.galleries where owner_id = owner $$;
grant execute on function tests.gallery_of(uuid) to public;

-- Gallery A keeps 40% by default. Each case below sells its own work.
-- w01 default rate · w02 work rate 25% · w03 work rate 25% (param overrides)
-- w04 0% · w05 100% · w06 rounding · w07 rounding · w08 rounding
-- w09 discount · w10 discount = price · w11 sold twice · w12 bad rate · w13 other gallery
insert into public.catalogue_works (id, gallery_id, artist_id, title, commission_rate)
select ('00000000-0000-4000-8000-0000000003' || lpad(to_hex(n), 2, '0'))::uuid,
       case when n = 13 then tests.gallery_of('00000000-0000-4000-8000-0000000000b1') else tests.gallery_of('00000000-0000-4000-8000-0000000000a1') end,
       '00000000-0000-4000-8000-000000000011', 'Work ' || n, case when n in (2, 3) then 0.250 end
from generate_series(1, 13) n;

-- Wide sweep: 200 sales across awkward prices and rates, checked in bulk below.
insert into public.catalogue_works (gallery_id, artist_id, title)
select tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Sweep ' || n from generate_series(1, 200) n;

create function tests.sale(w uuid) returns public.sales language sql as $$ select * from public.sales where catalogue_work_id = w $$;
grant execute on function tests.sale(uuid) to public;

select tests.act_as('00000000-0000-4000-8000-0000000000a1');

-- ── Split maths ─────────────────────────────────────────────────────────
select public.record_sale('00000000-0000-4000-8000-000000000301', 100000);
select public.record_sale('00000000-0000-4000-8000-000000000302', 100000);
select public.record_sale('00000000-0000-4000-8000-000000000303', 100000, 0, 0.100);
select public.record_sale('00000000-0000-4000-8000-000000000304', 100000, 0, 0);
select public.record_sale('00000000-0000-4000-8000-000000000305', 100000, 0, 1);
select public.record_sale('00000000-0000-4000-8000-000000000306', 1005, 0, 0.5);
select public.record_sale('00000000-0000-4000-8000-000000000307', 1000, 0, 0.333);
select public.record_sale('00000000-0000-4000-8000-000000000308', 999);
select public.record_sale('00000000-0000-4000-8000-000000000309', 100000, 10000);
select public.record_sale('00000000-0000-4000-8000-00000000030a', 5000, 5000);


select is((tests.sale('00000000-0000-4000-8000-000000000301')).commission_rate, 0.400, 'falls back to the gallery rate');
select is((tests.sale('00000000-0000-4000-8000-000000000301')).commission_amount_cents, 40000, 'gallery rate: commission');
select is((tests.sale('00000000-0000-4000-8000-000000000301')).artist_amount_cents, 60000, 'gallery rate: artist share');

select is((tests.sale('00000000-0000-4000-8000-000000000302')).commission_rate, 0.250, 'a work-level rate beats the gallery rate');
select is((tests.sale('00000000-0000-4000-8000-000000000302')).commission_amount_cents, 25000, 'work rate: commission');
select is((tests.sale('00000000-0000-4000-8000-000000000302')).artist_amount_cents, 75000, 'work rate: artist share');

select is((tests.sale('00000000-0000-4000-8000-000000000303')).commission_rate, 0.100, 'an explicit rate beats the work-level rate');
select is((tests.sale('00000000-0000-4000-8000-000000000303')).commission_amount_cents, 10000, 'explicit rate: commission');
select is((tests.sale('00000000-0000-4000-8000-000000000303')).artist_amount_cents, 90000, 'explicit rate: artist share');

select is((tests.sale('00000000-0000-4000-8000-000000000304')).commission_rate, 0.000, '0% commission is honoured, not treated as unset');
select is((tests.sale('00000000-0000-4000-8000-000000000304')).commission_amount_cents, 0, '0%: gallery takes nothing');
select is((tests.sale('00000000-0000-4000-8000-000000000304')).artist_amount_cents, 100000, '0%: artist takes everything');

select is((tests.sale('00000000-0000-4000-8000-000000000305')).commission_amount_cents, 100000, '100%: gallery takes everything');
select is((tests.sale('00000000-0000-4000-8000-000000000305')).artist_amount_cents, 0, '100%: artist takes nothing');

select is((tests.sale('00000000-0000-4000-8000-000000000306')).commission_amount_cents, 503, 'a half cent rounds up (1005 x 50%)');
select is((tests.sale('00000000-0000-4000-8000-000000000306')).artist_amount_cents, 502, 'the artist gets the remainder, so no cent is lost');
select is((tests.sale('00000000-0000-4000-8000-000000000307')).commission_amount_cents, 333, '1000 x 33.3% = 333 cents');
select is((tests.sale('00000000-0000-4000-8000-000000000307')).artist_amount_cents, 667, '1000 x 33.3%: artist share');
select is((tests.sale('00000000-0000-4000-8000-000000000308')).commission_amount_cents, 400, '999 x 40% = 399.6 rounds to 400');
select is((tests.sale('00000000-0000-4000-8000-000000000308')).artist_amount_cents, 599, '999 x 40%: artist share');

select is((tests.sale('00000000-0000-4000-8000-000000000309')).sale_price_cents, 100000, 'the list price is kept as sold');
select is((tests.sale('00000000-0000-4000-8000-000000000309')).discount_cents, 10000, 'the discount is recorded');
select is((tests.sale('00000000-0000-4000-8000-000000000309')).commission_amount_cents, 36000, 'commission is taken on the discounted price');
select is((tests.sale('00000000-0000-4000-8000-000000000309')).artist_amount_cents, 54000, 'the artist share is of the discounted price');

select is((tests.sale('00000000-0000-4000-8000-00000000030a')).commission_amount_cents + (tests.sale('00000000-0000-4000-8000-00000000030a')).artist_amount_cents, 0, 'a 100% discount leaves nothing to split');

-- Commission + artist share always equals the price paid, whatever the inputs.
select public.record_sale(w.id, (1 + (row_number() over (order by w.id) * 7919) % 999983)::int,
                          ((row_number() over (order by w.id) * 31) % 7)::int,
                          ((row_number() over (order by w.id) * 37) % 1001) / 1000.0)
from public.catalogue_works w where w.title like 'Sweep %';
select is(
  (select count(*)::int from public.sales s join public.catalogue_works w on w.id = s.catalogue_work_id
    where w.title like 'Sweep %' and s.commission_amount_cents + s.artist_amount_cents <> s.sale_price_cents - s.discount_cents),
  0, 'commission + artist share equals the net price for 200 awkward sales');
select is((select count(*)::int from public.sales s join public.catalogue_works w on w.id = s.catalogue_work_id where w.title like 'Sweep %'), 200, 'all 200 sweep sales recorded');

-- ── Side effects ────────────────────────────────────────────────────────
select is((select status from public.catalogue_works where id = '00000000-0000-4000-8000-000000000301'), 'sold', 'recording a sale marks the work sold');
select is((tests.sale('00000000-0000-4000-8000-000000000301')).artist_id, '00000000-0000-4000-8000-000000000011'::uuid, 'the sale belongs to the work''s artist');
select is((tests.sale('00000000-0000-4000-8000-000000000301')).gallery_id, tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'the sale belongs to the work''s gallery');
select is((select amount_cents from public.payouts where sale_id = (tests.sale('00000000-0000-4000-8000-000000000301')).id), 60000, 'a payout for the artist share is created automatically');
select is((select status from public.payouts where sale_id = (tests.sale('00000000-0000-4000-8000-000000000301')).id), 'due', 'the new payout is due');

-- ── Rejections ──────────────────────────────────────────────────────────
select throws_ok(format($$select public.record_sale(%L, 1000)$$, '00000000-0000-4000-8000-000000000301'), 'P0001', 'This work has already been marked as sold.', 'an already-sold work is rejected');
select is((select count(*)::int from public.sales where catalogue_work_id = '00000000-0000-4000-8000-000000000301'), 1, 'the rejected second sale left no extra row');
select is((select count(*)::int from public.payouts where sale_id = (tests.sale('00000000-0000-4000-8000-000000000301')).id), 1, 'and no extra payout');
select throws_ok(format($$select public.record_sale(%L, 1000, 2000)$$, '00000000-0000-4000-8000-00000000030b'), 'P0001', 'The discount cannot exceed the sale price.', 'a discount above the price is rejected');
select is((select status from public.catalogue_works where id = '00000000-0000-4000-8000-00000000030b'), 'available', 'a rejected sale leaves the work available');
select throws_ok(format($$select public.record_sale(%L, 1000, 0, 1.5)$$, '00000000-0000-4000-8000-00000000030c'), '23514', null, 'a commission rate above 100% is rejected');
select throws_ok(format($$select public.record_sale(%L, 1000, 0, -0.1)$$, '00000000-0000-4000-8000-00000000030c'), '23514', null, 'a negative commission rate is rejected');
select throws_ok(format($$select public.record_sale(%L, -1)$$, '00000000-0000-4000-8000-00000000030c'), 'P0001', null, 'a negative price is rejected');
select throws_ok(format($$select public.record_sale(%L, 1000)$$, gen_random_uuid()), 'P0001', 'This work could not be found.', 'an unknown work is rejected');
select throws_ok(format($$select public.record_sale(%L, 1000)$$, '00000000-0000-4000-8000-00000000030d'), 'P0001', 'This work could not be found.', 'another gallery''s work is rejected, without revealing it exists');

reset role;

-- Roles that don't own the gallery can't record sales at all.
select tests.act_as('00000000-0000-4000-8000-000000000011');
select throws_ok(format($$select public.record_sale(%L, 1000)$$, '00000000-0000-4000-8000-00000000030b'), 'P0001', 'This work could not be found.', 'an artist cannot record a sale, even of their own work');
reset role;
select tests.act_as(null);
select throws_ok(format($$select public.record_sale(%L, 1000)$$, '00000000-0000-4000-8000-00000000030b'), null, null, 'anon cannot record a sale');
reset role;

select * from finish();
rollback;
