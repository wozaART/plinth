-- Add the new "Works at the gallery" studio tab to every existing gallery
-- that doesn't already have one, rather than re-seeding the two known
-- galleries by slug (20261008120001_gallery_theming_backfill.sql) — this
-- stays correct for any gallery row, present or future.
update public.galleries
set studio_tabs = studio_tabs || '[{"id":"catalogue","label":"Works at the gallery","enabled":true}]'::jsonb
where not exists (
  select 1 from jsonb_array_elements(studio_tabs) t where t->>'id' = 'catalogue'
);
