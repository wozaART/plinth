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

-- Rows touched by a DML statement (RLS silently filters rather than erroring).
create function tests.affected(q text) returns int language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function tests.affected(text) to public;

create function tests.gallery_of(owner uuid) returns uuid language sql as
  $$ select id from public.galleries where owner_id = owner $$;
grant execute on function tests.gallery_of(uuid) to public;

-- Rows in gallery A and gallery B, owned by artist 1 and artist 2.
insert into public.contacts (gallery_id, name, email, role) values
  (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Contact A', 'ca@test.local', 'Collector'),
  (tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), 'Contact B', 'cb@test.local', 'Collector');
insert into public.exhibitions (gallery_id, title) values
  (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Show A'),
  (tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), 'Show B');
insert into public.submissions (id, gallery_id, artist_id, title) values
  ('00000000-0000-4000-8000-0000000005a1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Sub A1'),
  ('00000000-0000-4000-8000-0000000005b1', tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), '00000000-0000-4000-8000-000000000011', 'Sub B1');
insert into public.catalogue_works (id, gallery_id, artist_id, title, price) values
  ('00000000-0000-4000-8000-0000000003a1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Work A1', 1000),
  ('00000000-0000-4000-8000-0000000003a2', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000012', 'Work A2', 2000),
  ('00000000-0000-4000-8000-0000000003b1', tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), '00000000-0000-4000-8000-000000000011', 'Work B1', 3000),
  ('00000000-0000-4000-8000-0000000003b2', tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), '00000000-0000-4000-8000-000000000012', 'Work B2', 4000);
insert into public.frame_jobs (gallery_id, artist_id, title) values (tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), '00000000-0000-4000-8000-000000000011', 'Frame B1');
insert into public.messages (gallery_id, artist_id, sender, subject, body) values
  (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'gallery', 'Hi A1', 'x'),
  (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000012', 'gallery', 'Hi A2', 'x');
insert into public.artist_bank_details (id, bank_name, bank_account_number) values
  ('00000000-0000-4000-8000-000000000011', 'Bank One', '1111'), ('00000000-0000-4000-8000-000000000012', 'Bank Two', '2222');

-- A sale per artist in gallery A, with buyer details, recorded the real way.
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select public.record_sale('00000000-0000-4000-8000-0000000003a1', 100000, 0, null, 'Buyer One', 'buyer1@test.local', '0821111111');
select public.record_sale('00000000-0000-4000-8000-0000000003a2', 200000, 0, null, 'Buyer Two', 'buyer2@test.local', '0822222222');
reset role;

-- ── Gallery A's owner vs gallery B ──────────────────────────────────────
select tests.act_as('00000000-0000-4000-8000-0000000000a1');

select is((select count(*)::int from public.contacts), 1, 'owner A sees only their own contacts');
select is((select count(*)::int from public.contacts where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B contacts');
select is((select count(*)::int from public.catalogue_works where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B catalogue');
select is((select count(*)::int from public.submissions where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B submissions');
select is((select count(*)::int from public.frame_jobs where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B frame jobs');
select is((select count(*)::int from public.messages where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B messages');
select is((select count(*)::int from public.sales where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B sales');
select is((select count(*)::int from public.payouts where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B payouts');
select is((select count(*)::int from public.audit_log where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 0, 'owner A cannot read gallery B audit log');
select is((select count(*)::int from public.sales), 2, 'owner A sees both of their own sales');

-- Open calls are public by design, so B's exhibitions are readable...
select is((select count(*)::int from public.exhibitions where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 1, 'exhibitions are publicly readable');

-- ...but not writable.
select throws_ok(format($$insert into public.contacts (gallery_id, name, email, role) values (%L, 'x', 'x@test.local', 'Artist')$$, tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), '42501', null, 'owner A cannot insert contacts into gallery B');
select throws_ok(format($$insert into public.exhibitions (gallery_id, title) values (%L, 'x')$$, tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), '42501', null, 'owner A cannot insert exhibitions into gallery B');
select throws_ok(format($$insert into public.catalogue_works (gallery_id, artist_id, title) values (%L, '00000000-0000-4000-8000-000000000011', 'x')$$, tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), '42501', null, 'owner A cannot insert catalogue works into gallery B');
select is(tests.affected($q$update public.contacts set name = 'hacked' where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')$q$), 0, 'owner A cannot update gallery B contacts');
select is(tests.affected($q$update public.exhibitions set title = 'hacked' where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')$q$), 0, 'owner A cannot update gallery B exhibitions');
select is(tests.affected($q$update public.catalogue_works set title = 'hacked' where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')$q$), 0, 'owner A cannot update gallery B catalogue works');
select is(tests.affected($q$delete from public.contacts where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')$q$), 0, 'owner A cannot delete gallery B contacts');
select is(tests.affected($q$delete from public.exhibitions where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')$q$), 0, 'owner A cannot delete gallery B exhibitions');
select is(tests.affected($q$update public.galleries set name = 'hacked' where id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')$q$), 0, 'owner A cannot rename gallery B');
select throws_ok(format($$select public.record_sale(%L, 1000)$$, '00000000-0000-4000-8000-0000000003b1'), 'P0001', 'This work could not be found.', 'owner A cannot record a sale on a gallery B work');

-- The audit log is written by triggers only.
select throws_ok(format($$insert into public.audit_log (gallery_id, table_name, record_id, action, record) values (%L, 'contacts', gen_random_uuid(), 'insert', '{}')$$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1')), '42501', null, 'owners cannot write audit entries directly');

reset role;

-- ── Gallery B's owner (the same rules, from the other side) ─────────────
select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is((select count(*)::int from public.sales), 0, 'owner B sees no sales from gallery A');
select is((select count(*)::int from public.payouts), 0, 'owner B sees no payouts from gallery A');
select is((select count(*)::int from public.contacts where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000a1')), 0, 'owner B cannot read gallery A contacts');
reset role;

-- ── Artist 1 vs artist 2 ────────────────────────────────────────────────
select tests.act_as('00000000-0000-4000-8000-000000000011');

select is((select count(*)::int from public.sales where artist_id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 sales');
select is((select count(*)::int from public.artist_sales), 1, 'artist 1 sees only their own sale through the artist view');
select is((select count(*)::int from public.payouts where artist_id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 payouts');
select is((select count(*)::int from public.payouts), 1, 'artist 1 sees only their own payout');
select is((select count(*)::int from public.artist_bank_details where id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 bank details');
select is((select count(*)::int from public.artist_bank_details), 1, 'artist 1 can read their own bank details');
select is((select count(*)::int from public.catalogue_works where artist_id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 catalogue works');
select is((select count(*)::int from public.catalogue_works where artist_id = '00000000-0000-4000-8000-000000000011'), 2, 'artist 1 can read their own catalogue works (in every gallery)');
select is((select count(*)::int from public.artist_profiles where id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 profile');
select is((select count(*)::int from public.artist_sales where artist_id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 rows through the artist view');
select is((select count(*)::int from public.messages where artist_id = '00000000-0000-4000-8000-000000000012'), 0, 'artist 1 cannot read artist 2 messages');
select is((select count(*)::int from public.contacts), 0, 'artists cannot read any gallery contacts');
select is((select count(*)::int from public.audit_log), 0, 'artists cannot read any audit log');

select is(tests.affected($q$update public.artist_bank_details set bank_name = 'hacked' where id = '00000000-0000-4000-8000-000000000012'$q$), 0, 'artist 1 cannot update artist 2 bank details');
select is(tests.affected($q$update public.catalogue_works set title = 'hacked' where artist_id = '00000000-0000-4000-8000-000000000011'$q$), 0, 'artists cannot edit catalogue works');
select throws_ok($$select public.acknowledge_payout((select id from public.payouts limit 1))$$, 'P0001', 'This payout could not be acknowledged.', 'a payout cannot be acknowledged before it is paid');

-- Buyer identity: the artist-facing view has no buyer columns...
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'artist_sales' and column_name in ('buyer_name', 'buyer_email', 'buyer_phone')), 0, 'artist_sales exposes no buyer columns');
-- ...and the base table must not hand them over either.
select is((select count(*)::int from public.sales), 0, 'artists cannot read any rows, buyer columns included, from the sales table');
select lives_ok($$select id, sale_price_cents, artist_amount_cents from public.artist_sales$$, 'artists can select their sales through the artist view');

reset role;

-- ── Anonymous ───────────────────────────────────────────────────────────
select tests.act_as(null);

select is((select count(*)::int from public.sales), 0, 'anon sees no sales');
select is((select count(*)::int from public.contacts), 0, 'anon sees no contacts');
select is((select count(*)::int from public.catalogue_works), 0, 'anon sees no catalogue works');
select is((select count(*)::int from public.submissions), 0, 'anon sees no submissions');
select is((select count(*)::int from public.messages), 0, 'anon sees no messages');
select is((select count(*)::int from public.frame_jobs), 0, 'anon sees no frame jobs');
select is((select count(*)::int from public.artist_profiles), 0, 'anon sees no artist profiles');
select is((select count(*)::int from public.artist_bank_details), 0, 'anon sees no bank details');
select is((select count(*)::int from public.payouts), 0, 'anon sees no payouts');
select is((select count(*)::int from public.audit_log), 0, 'anon sees no audit_log');
select throws_ok($$select count(*) from public.artist_sales$$, '42501', null, 'anon cannot query the artist view');
select throws_ok(format($$insert into public.contacts (gallery_id, name, email, role) values (%L, 'x', 'x@test.local', 'Artist')$$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1')), '42501', null, 'anon cannot insert contacts');
select throws_ok(format($$select public.record_sale(%L, 1000)$$, '00000000-0000-4000-8000-0000000003b1'), null, null, 'anon cannot record a sale');

reset role;
select * from finish();
rollback;
