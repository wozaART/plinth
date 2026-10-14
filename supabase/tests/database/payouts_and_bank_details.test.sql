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

-- Artist 1 has a sold work (w1) and an unsold one (w3) with gallery A; artist 2
-- has a sold work (w2) with gallery A.
insert into public.catalogue_works (id, gallery_id, artist_id, title) values
  ('00000000-0000-4000-8000-0000000003a1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Work 1'),
  ('00000000-0000-4000-8000-0000000003a2', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000012', 'Work 2'),
  ('00000000-0000-4000-8000-0000000003a3', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Work 3');
insert into public.artist_bank_details (id, bank_name, bank_account_number, branch_code, account_type) values
  ('00000000-0000-4000-8000-000000000011', 'Bank One', '1111', '250655', 'Cheque'), ('00000000-0000-4000-8000-000000000012', 'Bank Two', '2222', '051001', 'Savings');

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select public.record_sale('00000000-0000-4000-8000-0000000003a1', 100000);
select public.record_sale('00000000-0000-4000-8000-0000000003a2', 50000);
reset role;

-- Rows touched by a DML statement (RLS silently filters rather than erroring).
create function tests.affected(q text) returns int language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function tests.affected(text) to public;

create function tests.payout_of(artist uuid) returns public.payouts language sql as
  $$ select * from public.payouts where artist_id = artist $$;
grant execute on function tests.payout_of(uuid) to public;

-- ── mark_payout_paid ────────────────────────────────────────────────────
select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select throws_ok(format($$select public.mark_payout_paid(%L)$$, (select id from public.payouts where artist_id = '00000000-0000-4000-8000-000000000011')), null, null, 'another gallery cannot mark a payout paid');
reset role;

select tests.act_as('00000000-0000-4000-8000-000000000011');
select throws_ok(format($$select public.mark_payout_paid(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'P0001', 'This payout could not be found.', 'an artist cannot mark their own payout paid');
select throws_ok(format($$select public.acknowledge_payout(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'P0001', 'This payout could not be acknowledged.', 'a due payout cannot be acknowledged');
select throws_ok(format($$select public.query_payout(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'P0001', 'This payout could not be queried.', 'a due payout cannot be queried');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select lives_ok(format($$select public.mark_payout_paid(%L, '2026-03-01', 'REF-1', 'path/proof.pdf')$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'the owner marks a payout paid');
select is((tests.payout_of('00000000-0000-4000-8000-000000000011')).status, 'paid', 'status becomes paid');
select is((tests.payout_of('00000000-0000-4000-8000-000000000011')).paid_at, '2026-03-01'::date, 'paid date recorded');
select is((tests.payout_of('00000000-0000-4000-8000-000000000011')).payment_reference, 'REF-1', 'payment reference recorded');
select is((tests.payout_of('00000000-0000-4000-8000-000000000011')).proof_of_payment_path, 'path/proof.pdf', 'proof path recorded');
select lives_ok(format($$select public.mark_payout_paid(%L, '2026-03-02')$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 're-marking without a proof path keeps the earlier proof');
select is((tests.payout_of('00000000-0000-4000-8000-000000000011')).proof_of_payment_path, 'path/proof.pdf', 'proof path preserved');
reset role;

-- ── acknowledge / query by the artist ───────────────────────────────────
select tests.act_as('00000000-0000-4000-8000-000000000012');
select throws_ok(format($$select public.acknowledge_payout(%L)$$, (select id from public.payouts where artist_id = '00000000-0000-4000-8000-000000000011')), 'P0001', 'This payout could not be acknowledged.', 'artist 2 cannot acknowledge artist 1''s payout');
select throws_ok(format($$select public.query_payout(%L)$$, (select id from public.payouts where artist_id = '00000000-0000-4000-8000-000000000011')), 'P0001', 'This payout could not be queried.', 'artist 2 cannot query artist 1''s payout');
reset role;

select tests.act_as('00000000-0000-4000-8000-000000000011');
select lives_ok(format($$select public.acknowledge_payout(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'the artist acknowledges their paid payout');
select is((tests.payout_of('00000000-0000-4000-8000-000000000011')).status, 'acknowledged', 'status becomes acknowledged');
select isnt((tests.payout_of('00000000-0000-4000-8000-000000000011')).acknowledged_at, null, 'acknowledgement time recorded');
select throws_ok(format($$select public.acknowledge_payout(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'P0001', 'This payout could not be acknowledged.', 'it cannot be acknowledged twice');
select throws_ok(format($$select public.query_payout(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000011')).id), 'P0001', 'This payout could not be queried.', 'an acknowledged payout cannot be queried afterwards');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select public.mark_payout_paid((tests.payout_of('00000000-0000-4000-8000-000000000012')).id);
reset role;
select tests.act_as('00000000-0000-4000-8000-000000000012');
select lives_ok(format($$select public.query_payout(%L)$$, (tests.payout_of('00000000-0000-4000-8000-000000000012')).id), 'the artist can query a paid payout');
select is((tests.payout_of('00000000-0000-4000-8000-000000000012')).status, 'queried', 'status becomes queried');
reset role;

-- Artists can't edit payouts directly.
select tests.act_as('00000000-0000-4000-8000-000000000011');
select is(tests.affected(format($$update public.payouts set status = 'due', amount_cents = 999999 where artist_id = %L$$, '00000000-0000-4000-8000-000000000011')), 0, 'artists cannot update payouts directly');
reset role;

-- ── get_artist_bank_details_for_payout ──────────────────────────────────
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.get_artist_bank_details_for_payout('00000000-0000-4000-8000-000000000011')), 1, 'owner A can see the bank details of an artist they owe');
select is((select bank_account_number from public.get_artist_bank_details_for_payout('00000000-0000-4000-8000-000000000011')), '1111', 'and gets the right account');
select is((select count(*)::int from public.artist_bank_details), 0, 'but cannot select the table directly');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is((select count(*)::int from public.get_artist_bank_details_for_payout('00000000-0000-4000-8000-000000000011')), 0, 'owner B (no sale involving the artist) gets nothing');
reset role;

select tests.act_as('00000000-0000-4000-8000-000000000012');
select is((select count(*)::int from public.get_artist_bank_details_for_payout('00000000-0000-4000-8000-000000000011')), 0, 'artist 2 cannot fetch artist 1''s bank details');
reset role;

select tests.act_as(null);
select is((select count(*)::int from public.get_artist_bank_details_for_payout('00000000-0000-4000-8000-000000000011')), 0, 'anon gets nothing');
reset role;

select * from finish();
rollback;
