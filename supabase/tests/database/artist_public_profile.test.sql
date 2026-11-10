begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ── Fixtures ────────────────────────────────────────────────────────────
-- Gallery A (owner a1) has dealt with artist 1 (a submission). Gallery B
-- (owner b1) has not. Artist 2 has no relationship with anyone.

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@test.local', '{"role":"gallery","gallery_name":"Gallery A"}'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@test.local', '{"role":"gallery","gallery_name":"Gallery B"}'),
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist1@test.local', '{"role":"artist","full_name":"Artist One"}'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist2@test.local', '{"role":"artist","full_name":"Artist Two"}');

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

insert into public.submissions (gallery_id, artist_id, title)
values (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-000000000011', 'Salt Pan');

-- ── Portfolio: cap of ten, own rows only ────────────────────────────────

select tests.act_as('00000000-0000-4000-8000-000000000011');

select lives_ok(
  $$ insert into public.artist_portfolio_works (artist_id, title, image_url, position)
     select auth.uid(), 'Work ' || n, 'https://img.test/' || n || '.jpg', n from generate_series(1, 10) n $$,
  'an artist can add ten portfolio works');

select throws_ok(
  $$ insert into public.artist_portfolio_works (artist_id, title, image_url) values (auth.uid(), 'Eleventh', 'https://img.test/11.jpg') $$,
  '23514', null, 'the eleventh portfolio work is rejected');

select throws_ok(
  $$ insert into public.artist_portfolio_works (artist_id, title, image_url) values (auth.uid(), '   ', 'https://img.test/x.jpg') $$,
  '23514', null, 'a work needs a title');

select lives_ok(
  $$ delete from public.artist_portfolio_works where title = 'Work 10' $$,
  'removing a work frees a slot');
select lives_ok(
  $$ insert into public.artist_portfolio_works (artist_id, title, image_url) values (auth.uid(), 'Replacement', 'https://img.test/r.jpg') $$,
  'and another can be added');

select tests.act_as('00000000-0000-4000-8000-000000000012');

select throws_ok(
  $$ insert into public.artist_portfolio_works (artist_id, title, image_url) values ('00000000-0000-4000-8000-000000000011', 'Planted', 'https://img.test/p.jpg') $$,
  '42501', null, 'an artist cannot add works to someone else''s portfolio');

select is((select count(*)::int from public.artist_portfolio_works), 0, 'an unrelated artist sees no one else''s portfolio');

update public.artist_portfolio_works set title = 'Hijacked' where artist_id = '00000000-0000-4000-8000-000000000011';
delete from public.artist_portfolio_works where artist_id = '00000000-0000-4000-8000-000000000011';

reset role;
select is((select count(*)::int from public.artist_portfolio_works where title = 'Hijacked'), 0, 'another artist cannot edit works');
select is((select count(*)::int from public.artist_portfolio_works where artist_id = '00000000-0000-4000-8000-000000000011'), 10, 'another artist cannot delete works');

-- ── Links ───────────────────────────────────────────────────────────────

select tests.act_as('00000000-0000-4000-8000-000000000011');

select lives_ok(
  $$ select public.replace_artist_links('[{"kind":"website","url":"https://ana.art"},{"kind":"instagram","url":"https://instagram.com/ana"}]'::jsonb) $$,
  'links can be saved');
select is((select count(*)::int from public.artist_links), 2, 'both links are stored');
select is((select url from public.artist_links order by position limit 1), 'https://ana.art', 'in the order given');

select throws_ok(
  $$ select public.replace_artist_links('[{"kind":"website","url":"javascript:alert(1)"}]'::jsonb) $$,
  '23514', null, 'a non-http link is rejected');
select is((select count(*)::int from public.artist_links), 2, 'and a failed save leaves the previous links in place');

select throws_ok(
  $$ select public.replace_artist_links('[{"kind":"myspace","url":"https://x.test"}]'::jsonb) $$,
  '23514', null, 'an unknown link type is rejected');

select throws_ok(
  $$ select public.replace_artist_links((select jsonb_agg(jsonb_build_object('kind','website','url','https://a.test/' || n)) from generate_series(1, 11) n)) $$,
  '23514', null, 'more than ten links are rejected');

select lives_ok($$ select public.replace_artist_links('[]'::jsonb) $$, 'links can be cleared');
select is((select count(*)::int from public.artist_links), 0, 'and none remain');

-- ── Photos: one profile photo, six studio photos ────────────────────────

select lives_ok(
  $$ insert into public.artist_photos (artist_id, kind, image_url) values (auth.uid(), 'profile', 'https://img.test/me.jpg') $$,
  'an artist can set a profile photo');
select throws_ok(
  $$ insert into public.artist_photos (artist_id, kind, image_url) values (auth.uid(), 'profile', 'https://img.test/me2.jpg') $$,
  '23505', null, 'but only one');
select lives_ok(
  $$ insert into public.artist_photos (artist_id, kind, image_url) select auth.uid(), 'studio', 'https://img.test/s' || n || '.jpg' from generate_series(1, 6) n $$,
  'six studio photos are fine');
select throws_ok(
  $$ insert into public.artist_photos (artist_id, kind, image_url) values (auth.uid(), 'studio', 'https://img.test/s7.jpg') $$,
  '23514', null, 'a seventh is rejected');
select throws_ok(
  $$ insert into public.artist_photos (artist_id, kind, image_url) values (auth.uid(), 'cover', 'https://img.test/c.jpg') $$,
  '23514', null, 'unknown photo types are rejected');

-- ── Who can read an artist's profile ────────────────────────────────────

select tests.act_as('00000000-0000-4000-8000-000000000011');
update public.artist_profiles set bio = 'I paint the coast.' where id = auth.uid();

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.artist_portfolio_works where artist_id = '00000000-0000-4000-8000-000000000011'), 10, 'a gallery that has dealt with the artist reads their portfolio');
select is((select count(*)::int from public.artist_photos where artist_id = '00000000-0000-4000-8000-000000000011'), 7, 'and their photos');
select is((select bio from public.artist_profiles where id = '00000000-0000-4000-8000-000000000011'), 'I paint the coast.', 'and their bio');
select throws_ok(
  $$ insert into public.artist_links (artist_id, kind, url) values ('00000000-0000-4000-8000-000000000011', 'website', 'https://planted.test') $$,
  '42501', null, 'but a gallery cannot write to it');

select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is((select count(*)::int from public.artist_portfolio_works), 0, 'a gallery that has not dealt with the artist sees no works');
select is((select count(*)::int from public.artist_photos), 0, 'no photos');
select is((select count(*)::int from public.artist_links), 0, 'no links');

select tests.act_as(null);
select is((select count(*)::int from public.artist_portfolio_works), 0, 'anonymous users see no portfolios');
select is((select count(*)::int from public.artist_photos), 0, 'and no photos');

-- ── Contact -> artist lookup ────────────────────────────────────────────

reset role;
insert into public.contacts (id, gallery_id, name, email, role) values
  ('00000000-0000-4000-8000-0000000007a1', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Artist One', 'ARTIST1@test.local', 'Artist'),
  ('00000000-0000-4000-8000-0000000007a2', tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), 'Artist Two', 'artist2@test.local', 'Artist'),
  ('00000000-0000-4000-8000-0000000007b1', tests.gallery_of('00000000-0000-4000-8000-0000000000b1'), 'Artist One', 'artist1@test.local', 'Artist');

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007a1'), '00000000-0000-4000-8000-000000000011'::uuid, 'an artist contact resolves to their account, ignoring email case');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007a2'), null, 'an artist the gallery has not dealt with does not resolve');
reset role;
update public.contacts set role = 'Collector' where id = '00000000-0000-4000-8000-0000000007a1';
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007a1'), null, 'a collector contact does not resolve');
reset role;
update public.contacts set role = 'Artist' where id = '00000000-0000-4000-8000-0000000007a1';
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007b1'), null, 'another gallery''s contact does not resolve');

select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007b1'), null, 'a gallery with no dealings cannot use a contact to find the artist');

-- An accepted invite counts as dealings, even with no submission or message.
reset role;
insert into public.artist_invites (gallery_id, invited_by, email, status)
values (tests.gallery_of('00000000-0000-4000-8000-0000000000a1'), '00000000-0000-4000-8000-0000000000a1', 'Artist2@test.local', 'pending');
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007a2'), null, 'a pending invite is not enough');
reset role;
update public.artist_invites set status = 'accepted' where lower(email) = 'artist2@test.local';
select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is(public.get_contact_artist_id('00000000-0000-4000-8000-0000000007a2'), '00000000-0000-4000-8000-000000000012'::uuid, 'an artist who accepted the gallery''s invite resolves');
select is((select full_name from public.artist_profiles where id = '00000000-0000-4000-8000-000000000012'), 'Artist Two', 'and their profile row is readable');
select tests.act_as('00000000-0000-4000-8000-0000000000b1');
select is(public.gallery_can_view_artist('00000000-0000-4000-8000-000000000012'), false, 'but another gallery still cannot see them');
select is((select count(*)::int from public.artist_profiles where id = '00000000-0000-4000-8000-000000000012'), 0, 'and cannot read their profile row');

-- ── Storage ─────────────────────────────────────────────────────────────

select tests.act_as('00000000-0000-4000-8000-000000000011');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values ('artist-profile-images', auth.uid() || '/w1/1.jpg', auth.uid()) $$,
  'an artist can upload into their own folder');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner) values ('artist-profile-images', '00000000-0000-4000-8000-000000000012/w1/1.jpg', auth.uid()) $$,
  '42501', null, 'but not into another artist''s folder');

select tests.act_as('00000000-0000-4000-8000-000000000012');
select is((select count(*)::int from storage.objects where bucket_id = 'artist-profile-images' and name = '00000000-0000-4000-8000-000000000011/w1/1.jpg'), 1, 'uploaded images are readable by other users, like submission images');

select * from finish();
rollback;
