begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ── Fixtures ────────────────────────────────────────────────────────────
-- Gallery A (owner a1) with artist 1; gallery B (owner b1).

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@test.local', '{"role":"gallery","gallery_name":"Gallery A"}'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@test.local', '{"role":"gallery","gallery_name":"Gallery B"}'),
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist1@test.local', '{"role":"artist","full_name":"Artist One"}');

create schema tests;
grant usage on schema tests to public;

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

insert into public.exhibitions (id, gallery_id, title, consignment_terms_text) values
  ('00000000-0000-4000-8000-0000000004a1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'With text terms', 'Commission is 40%.'),
  ('00000000-0000-4000-8000-0000000004a2', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'No terms', null);
insert into public.exhibitions (id, gallery_id, title, consignment_terms_pdf_path) values
  ('00000000-0000-4000-8000-0000000004a3', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'With PDF terms',
   tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/00000000-0000-4000-8000-0000000004a3/1.pdf');

-- ── Either/or ───────────────────────────────────────────────────────────

select throws_ok(
  $$ update public.exhibitions set consignment_terms_text = 'x', consignment_terms_pdf_path = 'y' where id = '00000000-0000-4000-8000-0000000004a1' $$,
  '23514', null, 'an exhibition cannot have both typed terms and a PDF');

-- ── Agreement is required and snapshotted ───────────────────────────────

select tests.act_as('00000000-0000-4000-8000-000000000011');

select throws_ok(
  format($$ insert into public.submissions (gallery_id, exhibition_id, artist_id, title) values (%L, '00000000-0000-4000-8000-0000000004a1', auth.uid(), 'W') $$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1')),
  '23514', null, 'submitting to an exhibition with text terms without agreeing is rejected');

select throws_ok(
  format($$ insert into public.submissions (gallery_id, exhibition_id, artist_id, title, terms_ack) values (%L, '00000000-0000-4000-8000-0000000004a3', auth.uid(), 'W', false) $$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1')),
  '23514', null, 'submitting to an exhibition with PDF terms without agreeing is rejected');

select lives_ok(
  format($$ insert into public.submissions (id, gallery_id, exhibition_id, artist_id, title) values ('00000000-0000-4000-8000-0000000005a2', %L, '00000000-0000-4000-8000-0000000004a2', auth.uid(), 'W') $$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1')),
  'an exhibition without terms needs no agreement');

select lives_ok(
  format($$ insert into public.submissions (id, gallery_id, exhibition_id, artist_id, title, terms_ack, terms_agreed_text) values ('00000000-0000-4000-8000-0000000005a1', %L, '00000000-0000-4000-8000-0000000004a1', auth.uid(), 'W', true, 'forged') $$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1')),
  'agreeing lets the submission through');

reset role;

select is(
  (select terms_agreed_text from public.submissions where id = '00000000-0000-4000-8000-0000000005a1'),
  'Commission is 40%.',
  'the snapshot is the exhibition''s terms, not whatever the client sent');
select isnt((select terms_agreed_at from public.submissions where id = '00000000-0000-4000-8000-0000000005a1'), null, 'the agreement time is recorded');

update public.exhibitions set consignment_terms_text = 'Commission is 50%.' where id = '00000000-0000-4000-8000-0000000004a1';
select is(
  (select terms_agreed_text from public.submissions where id = '00000000-0000-4000-8000-0000000005a1'),
  'Commission is 40%.',
  'editing the terms later leaves the earlier agreement untouched');

-- ── Storage ─────────────────────────────────────────────────────────────

insert into storage.objects (bucket_id, name, owner) values
  ('exhibition-terms', tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/00000000-0000-4000-8000-0000000004a3/1.pdf', null),
  ('exhibition-terms', tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/00000000-0000-4000-8000-0000000004a3/old.pdf', null);

select tests.act_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'exhibition-terms' and name like tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/%'), 1,
  'an artist reads only the exhibition''s current terms PDF, not superseded files');

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'exhibition-terms' and name like tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/%'), 2,
  'the owning gallery reads every file in its folder');

select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'exhibition-terms' and name like tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/%'), 1,
  'another gallery''s owner sees only the current terms PDF, same as the public exhibition row, not superseded files');

select throws_ok(
  format($$ insert into storage.objects (bucket_id, name) values ('exhibition-terms', %L) $$, tests.gallery_of('00000000-0000-4000-8000-0000000000a1') || '/x/2.pdf'),
  '42501', null, 'another gallery cannot write into this gallery''s folder');

select * from finish();
rollback;
