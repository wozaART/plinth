-- JVH Art Gallery demo/seed data.
--
-- Creates one gallery-owner account and eight artist accounts (all sharing
-- the demo password below), the `jvh` gallery tenant, its exhibitions,
-- submissions, catalogue, frameshop queue, contacts and messages.
--
-- Demo login password for every seeded account: PlinthDemo123!
--
-- Tariq Hendricks (tariq@demo.plinth.test) is the artist the studio UI
-- assumes is signed in, so his submissions/messages match what the studio
-- page renders (Overview stats, the declined "City Grid" banner, the
-- Archive Fragment III / Rooftop Study messages).

create extension if not exists pgcrypto with schema extensions;

-- ── Auth users ──────────────────────────────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@jvh.demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"gallery","gallery_name":"JVH Art Gallery","full_name":"JVH Gallery Team","city":"Garsfontein, Pretoria"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'thandiwe@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Thandiwe Mokoena","practice":"Landscape painting","city":"Johannesburg"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'sipho@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Sipho Dlamini","practice":"Mixed media","city":"Durban"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000103', 'authenticated', 'authenticated', 'lerato@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Lerato Khumalo","practice":"Painting","city":"Pretoria"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000104', 'authenticated', 'authenticated', 'johan@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Johan Pretorius","practice":"Sculpture","city":"Bloemfontein"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000105', 'authenticated', 'authenticated', 'aisha@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Aisha Patel","practice":"Watercolour","city":"Cape Town"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000106', 'authenticated', 'authenticated', 'nomvula@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Nomvula Zulu","practice":"Abstract painting","city":"Johannesburg"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000107', 'authenticated', 'authenticated', 'karel@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Karel Botha","practice":"Ceramics","city":"Stellenbosch"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000108', 'authenticated', 'authenticated', 'tariq@demo.plinth.test', extensions.crypt('PlinthDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Tariq Hendricks","practice":"Street photography","city":"Cape Town"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u
where u.id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000104',
  '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000106',
  '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000108'
)
on conflict do nothing;

-- artist_profiles and a galleries row for the owner were just created by
-- the handle_new_user() trigger (fired per-row by the auth.users insert
-- above) from each account's signup metadata. artist_profiles already has
-- the right id/full_name/practice/city, so just add Tariq's bank details.
-- The trigger-created galleries row has a random id and a slugified name
-- ("jvh-art-gallery") rather than the fixed id and "jvh" slug the rest of
-- this file and the app's NEXT_PUBLIC_GALLERY config expect — normalize it
-- in place instead of inserting a second row (which would collide with the
-- one-gallery-per-owner unique constraint).

update public.artist_profiles
set bank_account_number = '62834571903', account_type = 'Cheque'
where id = '00000000-0000-4000-8000-000000000108';

update public.galleries
set id = '00000000-0000-4000-8000-000000000002',
    slug = 'jvh',
    name = 'JVH Art Gallery',
    city = 'Garsfontein, Pretoria',
    commission_rate = 0.400,
    delivery_address = '593 Jacqueline Dr, Garsfontein, Pretoria',
    drop_off_pass_prefix = 'JVH-S'
where owner_id = '00000000-0000-4000-8000-000000000001';

-- ── Exhibitions ─────────────────────────────────────────────────────────

insert into public.exhibitions (id, gallery_id, title, dates_label, status, blurb, slots, submission_deadline) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002', 'Highveld Light', '12 Jul – 30 Aug 2026', 'open', 'Group show · landscape & memory of the interior', 14, '2026-07-15'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', 'New Ground: Emerging Voices', '6 Sep – 18 Oct 2026', 'planning', 'Solo & duo presentations · under-35 artists', 8, '2026-08-01'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000002', 'Clay & Country', 'Currently hanging', 'hanging', 'Ceramics & sculpture from the Karoo', 20, null),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000002', 'Summer Salon 2025', 'Closed · Dec 2025', 'closed', 'Annual mixed exhibition', 30, null)
on conflict (id) do nothing;

-- ── Submissions ─────────────────────────────────────────────────────────
-- s1-s7 are the gallery-side open-call submissions; the last four are
-- Tariq's own works, reconciled with the studio page's messages/banner.

insert into public.submissions (id, gallery_id, exhibition_id, artist_id, title, year, medium, dim, price, status, note, ack, statement, created_at) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 'Veld at First Light', 2024, 'Oil on canvas', '120 × 90 cm', 24000, 'pending', '', null, 'A study of dawn breaking over the Highveld grasslands — part of an ongoing series on light and memory in the interior.', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000102', 'Mother Tongue III', 2023, 'Mixed media on board', '80 × 80 cm', 18500, 'pending', '', null, 'Layered text and pigment exploring isiZulu idiom and inherited language.', now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000103', 'Salt Pan, Evening', 2024, 'Acrylic on canvas', '100 × 70 cm', 21000, 'pending', '', null, 'The Makgadikgadi at dusk, painted from field sketches made over three winters.', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000104', 'Untitled (Wire Figure)', 2024, 'Galvanised wire', '45 × 30 × 30 cm', 9800, 'pending', '', null, 'A small standing figure continuing my exploration of township wire craft as fine-art form.', now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000105', 'Harbour, Kalk Bay', 2023, 'Watercolour on paper', '56 × 38 cm', 7200, 'pending', '', null, 'Plein-air watercolour of the working harbour at first light.', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000106', 'Red Ground', 2024, 'Oil on linen', '150 × 110 cm', 38000, 'approved', 'A strong, confident work — exactly the scale the east wall needs. Welcome aboard.', null, 'Large-format abstraction in oxide reds drawn from the soil of my grandmother''s farm.', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000107', 'Three Vessels', 2024, 'Raku-fired ceramic', 'Var. to 40 cm', 12400, 'approved', 'Beautiful glaze work. Please bring all three as a set.', null, 'A trio of raku vessels exploring crackle glaze and negative space.', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000308', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000108', 'City Grid', 2023, 'Oil on canvas', '110 × 80 cm', 15500, 'declined', 'Thank you for submitting. The work is accomplished, but City Grid falls outside the landscape focus of this particular exhibition. We''d warmly welcome a submission for our autumn open call.', false, 'A study of Cape Town''s CBD grid at midday, part of an ongoing urban-geometry series.', now() - interval '14 days'),
  ('00000000-0000-4000-8000-000000000309', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000108', 'Rooftop Study', 2024, 'Watercolour on paper', '48 × 36 cm', 8600, 'approved', 'A beautiful, quiet piece — exactly the counterpoint the south wall needs. Please see your drop-off pass for delivery details.', null, 'A quiet rooftop watercolour, painted from the studio window over several mornings.', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000310', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000108', 'Archive Fragment III', 2024, 'Mixed media on board', '70 × 55 cm', 13200, 'changes', 'We love the direction. Could you reconsider the framing? The bare edge is drawing the eye away from the work. A thin, neutral float would help.', null, 'Third in a series reworking found municipal archive fragments into mixed-media collage.', now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000108', 'Long Street, Dawn', 2024, 'Acrylic on linen', '90 × 60 cm', 11400, 'pending', '', null, 'Long Street at first light, before the city wakes — first in a planned dawn-streets series.', now())
on conflict (id) do nothing;

-- ── Catalogue ───────────────────────────────────────────────────────────

insert into public.catalogue_works (id, gallery_id, submission_id, artist_id, title, price, status) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000106', 'Red Ground', 38000, 'available'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000000107', 'Three Vessels', 12400, 'available'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000103', 'Aloe Study II', 9500, 'sold'),
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000105', 'Quiet Interior', 14000, 'available'),
  ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000102', 'Drift', 22000, 'reserved'),
  ('00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000104', 'Karoo Nightfall', 16800, 'available'),
  ('00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000102', 'Mother Tongue I', 18500, 'sold'),
  ('00000000-0000-4000-8000-000000000408', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000105', 'Coastline', 11200, 'on loan'),
  ('00000000-0000-4000-8000-000000000409', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000104', 'Standing Figure', 9800, 'available')
on conflict (id) do nothing;

-- ── Frameshop ───────────────────────────────────────────────────────────

insert into public.frame_jobs (id, gallery_id, submission_id, artist_id, title, spec, stage, due_date) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000106', 'Red Ground', 'Float frame · oiled oak, 30mm', 'queued', '2026-07-14'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', 'Veld at First Light', 'Box frame · charcoal ash', 'building', '2026-07-11'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000103', 'Salt Pan, Evening', 'Conservation mount + glass', 'building', '2026-07-12'),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000105', 'Quiet Interior', 'Float frame · natural maple', 'ready', '2026-07-05')
on conflict (id) do nothing;

-- ── Contacts ────────────────────────────────────────────────────────────

insert into public.contacts (id, gallery_id, name, email, role, focus, last_contact_at) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000002', 'Nomvula Zulu', 'nomvula@studio.co.za', 'Artist', 'Abstract painting', now()),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000002', 'Karel Botha', 'kbotha@mail.com', 'Artist', 'Ceramics', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000002', 'Dr. Elize van Wyk', 'evanwyk@collect.co.za', 'Collector', 'Contemporary SA', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000002', 'Thandiwe Mokoena', 'thandiwe.m@gmail.com', 'Artist', 'Landscape', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000605', '00000000-0000-4000-8000-000000000002', 'The Ackerman Trust', 'art@ackermantrust.org', 'Collector', 'Sculpture', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000606', '00000000-0000-4000-8000-000000000002', 'Sipho Dlamini', 'sipho.d@studio.co.za', 'Artist', 'Mixed media', now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000002', 'Marcus Reid', 'm.reid@privatebank.com', 'Collector', 'Investment-grade', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000608', '00000000-0000-4000-8000-000000000002', 'Lerato Khumalo', 'lerato@khumalo.art', 'Artist', 'Painting', now() - interval '7 days')
on conflict (id) do nothing;

-- ── Messages ────────────────────────────────────────────────────────────

insert into public.messages (id, gallery_id, artist_id, submission_id, sender, subject, body, created_at) values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000310', 'gallery', 'Re: Archive Fragment III — Drop-off details', 'Hi Tariq, just following up on the framing note — when you''re happy with the change, please let us know and we''ll issue the drop-off pass. Looking forward to seeing it.', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000309', 'gallery', 'Rooftop Study — approved & drop-off pass', 'Your work has been selected for Highveld Light. Please find attached your drop-off pass with reference JVH-S14. Delivery to 593 Jacqueline Dr, Garsfontein, Pretoria. No unscheduled deliveries please.', now() - interval '7 days')
on conflict (id) do nothing;
