-- Phase 1 ("a writable catalogue"): catalogue_works already carried
-- artist_id / submission_id from the original schema, but nothing recorded
-- when a work was consigned, what it was agreed at, or what commission
-- applies to it specifically (vs. the gallery's blanket rate) — and
-- artists had no way to see their own catalogue rows.

alter table public.catalogue_works
  add column consigned_at date,
  add column agreed_price numeric(12,2),
  add column commission_rate numeric(4,3);

-- One catalogue row per accepted submission.
alter table public.catalogue_works
  add constraint catalogue_works_submission_id_key unique (submission_id);

-- catalogue_works was gallery-owner-only ("not artist-visible in the
-- current UI" — see the comment in 20260702175015_gallery_schema.sql).
-- Studio now shows artists their own consigned works.
create policy "catalogue_select_artist" on public.catalogue_works
  for select to authenticated
  using (artist_id = (select auth.uid()));
