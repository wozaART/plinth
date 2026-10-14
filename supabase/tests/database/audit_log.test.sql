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

create function tests.audit_for(tbl text, rid uuid) returns setof public.audit_log language sql as
  $$ select * from public.audit_log where table_name = tbl and record_id = rid order by ctid $$; -- one transaction means one created_at; heap order is insert order
grant execute on function tests.audit_for(text, uuid) to public;

select tests.act_as('00000000-0000-4000-8000-0000000000a1');

-- ── contacts ────────────────────────────────────────────────────────────
insert into public.contacts (id, gallery_id, name, email, role)
values ('00000000-0000-4000-8000-0000000007c1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Original', 'c@test.local', 'Collector');

select is((select count(*)::int from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), 1, 'an insert writes one audit entry');
select is((select action from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), 'insert', 'its action is insert');
select is((select gallery_id from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'scoped to the row''s gallery');
select is((select actor_id from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), '00000000-0000-4000-8000-0000000000a1'::uuid, 'records who did it');
select is((select actor_email from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), 'owner-a@test.local', 'and their email');
select is((select record->>'name' from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), 'Original', 'stores the new row');
select is((select old_record from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), null, 'an insert has no previous row');

update public.contacts set name = 'Renamed' where id = '00000000-0000-4000-8000-0000000007c1';
select is((select count(*)::int from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), 2, 'an update adds an entry');
select is((select action from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1') offset 1), 'update', 'its action is update');
select is((select record->>'name' from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1') offset 1), 'Renamed', 'stores the new row');
select is((select old_record->>'name' from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1') offset 1), 'Original', 'and the row as it was');

delete from public.contacts where id = '00000000-0000-4000-8000-0000000007c1';
select is((select count(*)::int from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1')), 3, 'a delete adds an entry');
select is((select action from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1') offset 2), 'delete', 'its action is delete');
select is((select record->>'name' from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1') offset 2), 'Renamed', 'stores the row that was removed');
select is((select old_record from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c1') offset 2), null, 'a delete has no separate previous row');

-- ── exhibitions and catalogue works are audited too ─────────────────────
insert into public.exhibitions (id, gallery_id, title) values ('00000000-0000-4000-8000-0000000007e1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Show');
update public.exhibitions set title = 'Show 2' where id = '00000000-0000-4000-8000-0000000007e1';
delete from public.exhibitions where id = '00000000-0000-4000-8000-0000000007e1';
select results_eq($$select action from tests.audit_for('exhibitions', '00000000-0000-4000-8000-0000000007e1')$$, $$values ('insert'), ('update'), ('delete')$$, 'exhibitions: insert, update and delete are all logged');

insert into public.catalogue_works (id, gallery_id, artist_id, title) values ('00000000-0000-4000-8000-0000000007f1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Work');
update public.catalogue_works set title = 'Work 2' where id = '00000000-0000-4000-8000-0000000007f1';
delete from public.catalogue_works where id = '00000000-0000-4000-8000-0000000007f1';
select results_eq($$select action from tests.audit_for('catalogue_works', '00000000-0000-4000-8000-0000000007f1')$$, $$values ('insert'), ('update'), ('delete')$$, 'catalogue works: insert, update and delete are all logged');

-- A sale flips the work to sold, which the catalogue trigger records.
insert into public.catalogue_works (id, gallery_id, artist_id, title) values ('00000000-0000-4000-8000-0000000007f2', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Sold work');
select public.record_sale('00000000-0000-4000-8000-0000000007f2', 1000);
select is((select (old_record->>'status') || ' -> ' || (record->>'status') from tests.audit_for('catalogue_works', '00000000-0000-4000-8000-0000000007f2') offset 1), 'available -> sold', 'recording a sale is visible in the catalogue audit trail');

-- ── Visibility ──────────────────────────────────────────────────────────
select cmp_ok((select count(*)::int from public.audit_log), '>=', 8, 'owner A can read their own audit trail');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is((select count(*)::int from public.audit_log), 0, 'owner B sees none of gallery A''s audit trail');
-- B's own edits are logged against B.
insert into public.contacts (gallery_id, name, email, role) values (tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), 'B contact', 'b@test.local', 'Collector');
select is((select count(*)::int from public.audit_log where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000b1')), 1, 'owner B sees their own entry');
select is((select count(*)::int from public.audit_log where gallery_id = tests.gallery_of('00000000-0000-4000-8000-0000000000a1')), 0, 'and still none of A''s');
reset role;

-- ── Edits with no signed-in user (e.g. a migration or the service role) ──
-- `reset role` doesn't clear the JWT claims act_as set.
select set_config('request.jwt.claims', '', true);
insert into public.contacts (id, gallery_id, name, email, role)
values ('00000000-0000-4000-8000-0000000007c2', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'System', 's@test.local', 'Artist');
select is((select actor_id from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c2')), null, 'without a signed-in user the actor is blank');
select is((select actor_email from tests.audit_for('contacts', '00000000-0000-4000-8000-0000000007c2')), null, 'and so is the email');

select * from finish();
rollback;
