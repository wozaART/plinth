begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ── Fixtures ────────────────────────────────────────────────────────────
-- Three galleries (owners ga/gb/gc) and three artists:
--   artist 1 accepted gallery A's artist invite and has nothing else yet,
--   artist 2 has only a pending exhibition invite from gallery B, by email,
--   artist 3 has dealt with no gallery.

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@test.local', '{"role":"gallery","gallery_name":"Gallery A"}'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@test.local', '{"role":"gallery","gallery_name":"Gallery B"}'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-c@test.local', '{"role":"gallery","gallery_name":"Gallery C"}'),
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist1@test.local', '{"role":"artist","full_name":"Artist One"}'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist2@test.local', '{"role":"artist","full_name":"Artist Two"}'),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist3@test.local', '{"role":"artist","full_name":"Artist Three"}');

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

insert into public.exhibitions (id, gallery_id, title) values
  ('00000000-0000-4000-8000-000000000ea1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Show A'),
  ('00000000-0000-4000-8000-000000000eb1', tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), 'Show B');

-- Email case differs on purpose: invites are matched case-insensitively.
insert into public.artist_invites (gallery_id, invited_by, email, status, accepted_at) values
  (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-0000000000a1', 'Artist1@Test.Local', 'accepted', now()),
  (tests.gallery_of('00000000-0000-4000-8000-0000000000c1'), '00000000-0000-4000-8000-0000000000c1', 'artist1@test.local', 'revoked', null);

insert into public.exhibition_invites (gallery_id, exhibition_id, invited_by, email, status) values
  (tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), '00000000-0000-4000-8000-000000000eb1', '00000000-0000-4000-8000-0000000000b1', 'artist2@test.local', 'pending');

-- ── artist_gallery_ids() ────────────────────────────────────────────────
select tests.act_as('00000000-0000-4000-8000-000000000011');
select set_eq(
  'select * from public.artist_gallery_ids()',
  format('values (%L::uuid)', tests.gallery_of('00000000-0000-4000-8000-0000000000a1')),
  'an accepted artist invite connects the artist to that gallery (a revoked one does not)'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-000000000012');
select set_eq(
  'select * from public.artist_gallery_ids()',
  format('values (%L::uuid)', tests.gallery_of('00000000-0000-4000-8000-0000000000b1')),
  'a pending exhibition invite sent to the artist''s email connects them to that gallery'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-000000000013');
select is((select count(*)::int from public.artist_gallery_ids()), 0, 'an artist who has dealt with no gallery gets none');
reset role;

select tests.act_as(null);
select throws_ok('select * from public.artist_gallery_ids()', '42501', null, 'anon cannot call artist_gallery_ids');
reset role;

-- ── Submissions land in the exhibition's own gallery ────────────────────
select tests.act_as('00000000-0000-4000-8000-000000000011');

select lives_ok(
  format($$insert into public.submissions (gallery_id, exhibition_id, artist_id, title) values (%L, '00000000-0000-4000-8000-000000000ea1', '00000000-0000-4000-8000-000000000011', 'Right gallery')$$,
    tests.gallery_of('00000000-0000-4000-8000-0000000000a1')),
  'an artist can submit to an exhibition under its own gallery'
);
select throws_ok(
  format($$insert into public.submissions (gallery_id, exhibition_id, artist_id, title) values (%L, '00000000-0000-4000-8000-000000000ea1', '00000000-0000-4000-8000-000000000011', 'Wrong gallery')$$,
    tests.gallery_of('00000000-0000-4000-8000-0000000000b1')),
  '42501', null,
  'a submission cannot pair one gallery with another gallery''s exhibition'
);

-- Having submitted, the gallery stays connected through the submission too.
select ok(
  tests.gallery_of('00000000-0000-4000-8000-0000000000a1') in (select * from public.artist_gallery_ids()),
  'a submission keeps the gallery in the artist''s studio'
);
reset role;

select * from finish();
rollback;
