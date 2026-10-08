-- JVH Art Gallery + The Sable Gallery demo/seed data.
--
-- Creates one gallery-owner account and eight artist accounts (all sharing
-- the demo password below), the `jvh` gallery tenant, its exhibitions,
-- submissions, catalogue, frameshop queue, contacts and messages. Also
-- creates a second gallery-owner account (owner@sable.demo.wozaart.test) and
-- five artist accounts for the `default` tenant (The Sable Gallery, see
-- lib/galleries/default.config.ts), with its own smaller populated dataset.
--
-- Demo login password for every seeded account: WozaArtDemo123!
--
-- Tariq Hendricks (tariq@demo.wozaart.test) is the artist the studio UI
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
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@jvh.demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"gallery","gallery_name":"JVH Art Gallery","full_name":"JVH Gallery Team","city":"Garsfontein, Pretoria"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'thandiwe@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Thandiwe Mokoena","practice":"Landscape painting","city":"Johannesburg"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'sipho@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Sipho Dlamini","practice":"Mixed media","city":"Durban"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000103', 'authenticated', 'authenticated', 'lerato@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Lerato Khumalo","practice":"Painting","city":"Pretoria"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000104', 'authenticated', 'authenticated', 'johan@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Johan Pretorius","practice":"Sculpture","city":"Bloemfontein"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000105', 'authenticated', 'authenticated', 'aisha@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Aisha Patel","practice":"Watercolour","city":"Cape Town"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000106', 'authenticated', 'authenticated', 'nomvula@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Nomvula Zulu","practice":"Abstract painting","city":"Johannesburg"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000107', 'authenticated', 'authenticated', 'karel@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Karel Botha","practice":"Ceramics","city":"Stellenbosch"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000108', 'authenticated', 'authenticated', 'tariq@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Tariq Hendricks","practice":"Street photography","city":"Cape Town"}', now(), now(), '', '', '', '')
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

insert into public.artist_bank_details (id, bank_account_number, account_type)
values ('00000000-0000-4000-8000-000000000108', '62834571903', 'Cheque')
on conflict (id) do update set bank_account_number = excluded.bank_account_number, account_type = excluded.account_type;

update public.galleries
set id = '00000000-0000-4000-8000-000000000002',
    slug = 'jvh',
    name = 'JVH Art Gallery',
    city = 'Garsfontein, Pretoria',
    commission_rate = 0.400,
    delivery_address = '593 Jacqueline Dr, Garsfontein, Pretoria',
    drop_off_pass_prefix = 'JVH-S',
    short_name = 'JVH',
    tagline = 'Contemporary art from across South Africa, rotating monthly.',
    logo_wordmark_primary = 'JVH',
    logo_wordmark_secondary = 'ART GALLERY',
    theme_mode = 'dark',
    font_display = '{"googleFont":"Cinzel","weights":["500","600","700"]}',
    font_body = '{"googleFont":"Poppins","weights":["300","400","500","600","700"]}',
    font_mono = '{"googleFont":"Geist_Mono"}',
    theme_colors = '{
      "accent": "#22C39C", "accentHover": "#159A79", "onAccent": "#06251C",
      "solid": "#22C39C", "onSolid": "#06251C",
      "bgApp": "#0C0C0E", "bgShell": "#141416", "sidebar": "#0C0C0E", "surface": "#1A1A1D", "surfaceDark": "#0C0C0E",
      "text": "#F3F2F0", "textBody": "#F3F2F0", "textSecondary": "#C6C4CA", "textMuted": "#9A98A0",
      "textSoft": "#9A98A0", "textFaint": "#6E6C74", "textEyebrow": "#9A98A0",
      "onDark": "#F3F2F0", "onDarkSoft": "#C4C2C8", "onDarkFaint": "#8A8478",
      "border": "#2C2C31", "borderStrong": "#2C2C31", "borderInput": "#2C2C31", "borderChip": "#2C2C31",
      "divider": "#2C2C31", "borderDark": "#2C2C31",
      "status": {
        "pending": {"bg": "rgba(224,181,74,.14)", "fg": "#E6C15C", "dot": "#E0B54A"},
        "approved": {"bg": "#2E7D52", "fg": "#EAFBF1", "dot": "#3FBE7C", "panelBg": "rgba(34,195,156,.09)", "panelBorder": "rgba(34,195,156,.3)"},
        "declined": {"bg": "rgba(224,96,80,.14)", "fg": "#EDA093", "dot": "#D66152", "panelBg": "rgba(224,96,80,.09)", "panelBorder": "rgba(224,96,80,.3)"},
        "changes": {"bg": "rgba(90,160,220,.14)", "fg": "#8FC3E6", "dot": "#5AA0DC", "panelBg": "rgba(90,160,220,.09)", "panelBorder": "rgba(90,160,220,.3)"}
      },
      "neutralChipBg": "#232327", "neutralChipFg": "#9A98A0"
    }',
    gallery_tabs = '[
      {"id":"submissions","label":"Submissions","enabled":true},
      {"id":"exhibitions","label":"Exhibitions","enabled":true},
      {"id":"catalogue","label":"Catalogue","enabled":true},
      {"id":"frameshop","label":"Frameshop","enabled":true},
      {"id":"contacts","label":"Contacts","enabled":true}
    ]',
    studio_tabs = '[
      {"id":"overview","label":"Overview","enabled":true},
      {"id":"submissions","label":"My submissions","enabled":true},
      {"id":"open-calls","label":"Open calls","enabled":true},
      {"id":"invitations","label":"Invitations","enabled":true},
      {"id":"profile","label":"Profile","enabled":true},
      {"id":"messages","label":"Messages","enabled":true}
    ]',
    currency_code = 'ZAR',
    submit_commission_note_template = 'The gallery commission of {rate}% will be added on top of your asking price for the final sale price shown to collectors.'
where owner_id = '00000000-0000-4000-8000-000000000001';

-- ── Exhibitions ─────────────────────────────────────────────────────────

insert into public.exhibitions (id, gallery_id, title, type, status, blurb, theme, medium_requirements, size_requirements, rules, slots, submission_deadline, opening_date, closing_date, delivery_date) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002', 'Highveld Light', 'group', 'open', 'Group show · landscape & memory of the interior', 'Landscape & memory of the interior', 'Any painting or works-on-paper medium', 'No dimension over 150cm on the longest edge', 'Work must be for sale, framed and ready to hang, and delivered by the delivery date below. No AI-generated or reproduced work.', 14, '2026-07-15', '2026-07-12', '2026-08-30', '2026-07-10'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', 'New Ground: Emerging Voices', 'solo', 'planning', 'Solo & duo presentations · under-35 artists', 'Emerging voices, under 35', null, null, 'Open to artists under 35. A short artist statement is required with every submission.', 8, '2026-08-01', '2026-09-06', '2026-10-18', '2026-09-03'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000002', 'Clay & Country', 'group', 'hanging', 'Ceramics & sculpture from the Karoo', 'Ceramics & sculpture from the Karoo', 'Ceramic or sculptural work only', null, null, 20, null, null, null, null),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000002', 'Summer Salon 2025', 'group', 'closed', 'Annual mixed exhibition', null, null, null, null, 30, null, null, '2025-12-05', null)
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

-- ═══════════════════════════════════════════════════════════════════════
-- The Sable Gallery demo/seed data (`default` tenant).
-- ═══════════════════════════════════════════════════════════════════════

-- ── Auth users ──────────────────────────────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-9000-000000000001', 'authenticated', 'authenticated', 'owner@sable.demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"gallery","gallery_name":"The Sable Gallery","full_name":"Sable Gallery Team","city":"Maboneng, Johannesburg"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-9000-000000000101', 'authenticated', 'authenticated', 'naledi@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Naledi Sithole","practice":"Oil painting","city":"Cape Town"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-9000-000000000102', 'authenticated', 'authenticated', 'bongani@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Bongani Ngcobo","practice":"Photography","city":"Johannesburg"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-9000-000000000103', 'authenticated', 'authenticated', 'zanele@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Zanele Mahlangu","practice":"Sculpture","city":"Durban"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-9000-000000000104', 'authenticated', 'authenticated', 'pieter@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Pieter van der Merwe","practice":"Printmaking","city":"Stellenbosch"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-9000-000000000105', 'authenticated', 'authenticated', 'amahle@demo.wozaart.test', extensions.crypt('WozaArtDemo123!', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"artist","full_name":"Amahle Ndlovu","practice":"Ceramics","city":"Gqeberha"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u
where u.id in (
  '00000000-0000-4000-9000-000000000001',
  '00000000-0000-4000-9000-000000000101', '00000000-0000-4000-9000-000000000102',
  '00000000-0000-4000-9000-000000000103', '00000000-0000-4000-9000-000000000104',
  '00000000-0000-4000-9000-000000000105'
)
on conflict do nothing;

-- artist_profiles and a galleries row for the owner were just created by
-- the handle_new_user() trigger from each account's signup metadata. Slug
-- must be normalized to "default" to match lib/galleries/default.config.ts
-- (NEXT_PUBLIC_GALLERY -> slug lookup in lib/supabase/gallery.ts), the same
-- way the JVH block above normalizes its own trigger-created row.

update public.galleries
set id = '00000000-0000-4000-9000-000000000002',
    slug = 'default',
    name = 'The Sable Gallery',
    city = 'Maboneng, Johannesburg',
    commission_rate = 0.400,
    delivery_address = 'Studio 4, Arts on Main, Maboneng, Johannesburg',
    drop_off_pass_prefix = 'PL-S',
    short_name = 'Sable',
    tagline = 'The quiet operating system for small contemporary galleries.',
    logo_wordmark_primary = 'Woza Art',
    theme_mode = 'light',
    font_display = '{"googleFont":"Newsreader","weights":["400","500","600"],"styles":["normal","italic"]}',
    font_body = '{"googleFont":"Geist"}',
    font_mono = '{"googleFont":"Geist_Mono"}',
    theme_colors = '{
      "accent": "#B5623C", "accentHover": "#9C4F30", "onAccent": "#FBFAF8",
      "solid": "#17150F", "onSolid": "#FBFAF8",
      "bgApp": "#FBFAF8", "bgShell": "#EFECE4", "sidebar": "#F4F1EA", "surface": "#FFFFFF", "surfaceDark": "#1C1A17",
      "text": "#17150F", "textBody": "#2A2723", "textSecondary": "#57534A", "textMuted": "#6B655B",
      "textSoft": "#8B8579", "textFaint": "#9A9486", "textEyebrow": "#A39D8E",
      "onDark": "#FBFAF8", "onDarkSoft": "#B8B2A6", "onDarkFaint": "#8A8478",
      "border": "#ECE8DE", "borderStrong": "#E7E3D9", "borderInput": "#E0DBCF", "borderChip": "#E4DFD3",
      "divider": "#F1EEE6", "borderDark": "#3D382F",
      "status": {
        "pending": {"bg": "#F4ECD9", "fg": "#8A6A1E", "dot": "#C2922F"},
        "approved": {"bg": "#E7EFE1", "fg": "#4A6138", "dot": "#6B8A4E", "panelBg": "#EEF2EA", "panelBorder": "#DBE6D2"},
        "declined": {"bg": "#F3E4E0", "fg": "#8A3A30", "dot": "#B04A3C", "panelBg": "#F8EAE6", "panelBorder": "#EAD2CB"},
        "changes": {"bg": "#E6EBEF", "fg": "#3C566B", "dot": "#5A7894", "panelBg": "#EAEEF2", "panelBorder": "#D5DEE6"}
      },
      "neutralChipBg": "#EEEAE0", "neutralChipFg": "#57534A"
    }',
    gallery_tabs = '[
      {"id":"submissions","label":"Submissions","enabled":true},
      {"id":"exhibitions","label":"Exhibitions","enabled":true},
      {"id":"catalogue","label":"Catalogue","enabled":true},
      {"id":"contacts","label":"Contacts","enabled":true},
      {"id":"frameshop","label":"Frameshop","enabled":false}
    ]',
    studio_tabs = '[
      {"id":"overview","label":"Overview","enabled":true},
      {"id":"submissions","label":"My submissions","enabled":true},
      {"id":"open-calls","label":"Open calls","enabled":true},
      {"id":"invitations","label":"Invitations","enabled":true},
      {"id":"messages","label":"Messages","enabled":true},
      {"id":"profile","label":"Profile","enabled":false}
    ]',
    currency_code = 'ZAR',
    submit_commission_note_template = 'The gallery commission of {rate}% will be added on top of your asking price for the final sale price shown to collectors.'
where owner_id = '00000000-0000-4000-9000-000000000001';

-- ── Exhibitions ─────────────────────────────────────────────────────────

insert into public.exhibitions (id, gallery_id, title, type, status, blurb, theme, medium_requirements, size_requirements, rules, slots, submission_deadline, opening_date, closing_date, delivery_date) values
  ('00000000-0000-4000-9000-000000000201', '00000000-0000-4000-9000-000000000002', 'Maboneng Nights', 'group', 'open', 'Group show · city life after dark', 'City life after dark', 'Any medium', 'No dimension over 120cm', 'Work must be for sale and delivered ready to hang. No AI-generated or reproduced work.', 12, '2026-07-20', '2026-08-03', '2026-09-21', '2026-07-28'),
  ('00000000-0000-4000-9000-000000000202', '00000000-0000-4000-9000-000000000002', 'New Terrain', 'solo', 'planning', 'Solo & duo presentations · emerging printmakers', 'Emerging printmakers', 'Printmaking only', null, 'Open to printmakers with fewer than 3 prior solo shows.', 6, '2026-09-01', '2026-10-05', '2026-11-15', '2026-09-28'),
  ('00000000-0000-4000-9000-000000000203', '00000000-0000-4000-9000-000000000002', 'Winter Salon 2025', 'group', 'closed', 'Annual mixed exhibition', null, null, null, null, 25, null, null, '2025-06-30', null)
on conflict (id) do nothing;

-- ── Submissions ─────────────────────────────────────────────────────────

insert into public.submissions (id, gallery_id, exhibition_id, artist_id, title, year, medium, dim, price, status, note, ack, statement, created_at) values
  ('00000000-0000-4000-9000-000000000301', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000201', '00000000-0000-4000-9000-000000000101', 'Neon Wash', 2024, 'Oil on canvas', '110 × 85 cm', 26500, 'pending', '', null, 'Maboneng''s sodium-lit streets rendered in thick, wet-on-wet oil.', now() - interval '2 days'),
  ('00000000-0000-4000-9000-000000000302', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000201', '00000000-0000-4000-9000-000000000102', 'Taxi Rank, Midnight', 2023, 'Silver gelatin print', '60 × 90 cm', 9200, 'approved', 'Striking composition — this anchors the north wall beautifully.', null, 'A long-exposure study of Johannesburg''s all-night taxi ranks.', now() - interval '6 days'),
  ('00000000-0000-4000-9000-000000000303', '00000000-0000-4000-9000-000000000002', null, '00000000-0000-4000-9000-000000000103', 'Fractured Vessel', 2024, 'Bronze', '55 × 25 × 25 cm', 34000, 'pending', '', null, 'Cast in three pieces and rejoined visibly, exploring repair as form.', now() - interval '3 days'),
  ('00000000-0000-4000-9000-000000000304', '00000000-0000-4000-9000-000000000002', null, '00000000-0000-4000-9000-000000000104', 'Winelands Woodcut No. 4', 2023, 'Woodcut on paper', '50 × 40 cm', 4800, 'declined', 'Lovely craft, but we''re fully subscribed on printmaking for this cycle. Please try our autumn open call.', false, 'Fourth in a series of woodcuts depicting the Stellenbosch winelands in winter.', now() - interval '10 days'),
  ('00000000-0000-4000-9000-000000000305', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000201', '00000000-0000-4000-9000-000000000105', 'Ash Glaze Triptych', 2024, 'Wood-fired ceramic', 'Var. to 35 cm', 15800, 'changes', 'We''d love to show this — could you rework the base of the centre piece? It''s slightly unstable for plinth display.', null, 'Three wood-fired vessels sharing a single ash glaze run.', now() - interval '4 days')
on conflict (id) do nothing;

-- ── Catalogue ───────────────────────────────────────────────────────────

insert into public.catalogue_works (id, gallery_id, submission_id, artist_id, title, price, status) values
  ('00000000-0000-4000-9000-000000000401', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000302', '00000000-0000-4000-9000-000000000102', 'Taxi Rank, Midnight', 9200, 'available'),
  ('00000000-0000-4000-9000-000000000402', '00000000-0000-4000-9000-000000000002', null, '00000000-0000-4000-9000-000000000101', 'Rooftop Pool, Braamfontein', 19500, 'available'),
  ('00000000-0000-4000-9000-000000000403', '00000000-0000-4000-9000-000000000002', null, '00000000-0000-4000-9000-000000000103', 'Small Standing Form', 8600, 'sold'),
  ('00000000-0000-4000-9000-000000000404', '00000000-0000-4000-9000-000000000002', null, '00000000-0000-4000-9000-000000000105', 'Blue Ash Bowl', 4200, 'reserved')
on conflict (id) do nothing;

-- ── Frameshop ───────────────────────────────────────────────────────────

insert into public.frame_jobs (id, gallery_id, submission_id, artist_id, title, spec, stage, due_date) values
  ('00000000-0000-4000-9000-000000000501', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000302', '00000000-0000-4000-9000-000000000102', 'Taxi Rank, Midnight', 'Box frame · matte black, 25mm', 'ready', '2026-07-18'),
  ('00000000-0000-4000-9000-000000000502', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000301', '00000000-0000-4000-9000-000000000101', 'Neon Wash', 'Float frame · raw steel', 'building', '2026-07-22')
on conflict (id) do nothing;

-- ── Contacts ────────────────────────────────────────────────────────────

insert into public.contacts (id, gallery_id, name, email, role, focus, last_contact_at) values
  ('00000000-0000-4000-9000-000000000601', '00000000-0000-4000-9000-000000000002', 'Naledi Sithole', 'naledi.s@studio.co.za', 'Artist', 'Oil painting', now()),
  ('00000000-0000-4000-9000-000000000602', '00000000-0000-4000-9000-000000000002', 'Bongani Ngcobo', 'bongani.n@lens.co.za', 'Artist', 'Photography', now() - interval '1 day'),
  ('00000000-0000-4000-9000-000000000603', '00000000-0000-4000-9000-000000000002', 'Mr. Thabo Radebe', 'tradebe@collect.co.za', 'Collector', 'Contemporary SA sculpture', now() - interval '3 days'),
  ('00000000-0000-4000-9000-000000000604', '00000000-0000-4000-9000-000000000002', 'Zanele Mahlangu', 'zanele.m@gmail.com', 'Artist', 'Sculpture', now() - interval '5 days')
on conflict (id) do nothing;

-- ── Messages ────────────────────────────────────────────────────────────

insert into public.messages (id, gallery_id, artist_id, submission_id, sender, subject, body, created_at) values
  ('00000000-0000-4000-9000-000000000701', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000105', '00000000-0000-4000-9000-000000000305', 'gallery', 'Re: Ash Glaze Triptych — base rework', 'Hi Amahle, just checking in on the centre piece''s base — let us know when it''s ready and we''ll confirm your slot in Maboneng Nights.', now() - interval '1 day'),
  ('00000000-0000-4000-9000-000000000702', '00000000-0000-4000-9000-000000000002', '00000000-0000-4000-9000-000000000102', '00000000-0000-4000-9000-000000000302', 'gallery', 'Taxi Rank, Midnight — approved & drop-off pass', 'Your work has been selected for Maboneng Nights. Please find attached your drop-off pass with reference PL-S07. Delivery to Studio 4, Arts on Main, Maboneng, Johannesburg.', now() - interval '6 days')
on conflict (id) do nothing;
