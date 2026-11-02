-- Per-exhibition consignment terms. A gallery either types/pastes the terms
-- or uploads a PDF (one or the other), and an artist must agree before
-- submitting work to that exhibition.
--
-- Not related to consignment_terms_responses, the platform-level survey.
--
-- When an artist agrees, the terms as they stand at that moment are copied
-- onto the submission (terms_agreed_*), so editing the exhibition's terms
-- later never rewrites what an earlier artist actually agreed to. The copy
-- is made by a trigger, not the client, so it can't be forged.

alter table public.exhibitions
  add column consignment_terms_text text
    check (char_length(consignment_terms_text) <= 20000),
  add column consignment_terms_pdf_path text,
  add constraint exhibitions_consignment_terms_either_or
    check (consignment_terms_text is null or consignment_terms_pdf_path is null);

alter table public.submissions
  add column terms_ack boolean,
  add column terms_agreed_at timestamptz,
  add column terms_agreed_text text,
  add column terms_agreed_pdf_path text;

-- ── Enforce agreement and snapshot the terms ─────────────────────────────

create or replace function public.submissions_enforce_terms()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ex_text text;
  ex_pdf text;
begin
  -- Clients only say whether they agreed; the snapshot is always ours.
  new.terms_agreed_at := null;
  new.terms_agreed_text := null;
  new.terms_agreed_pdf_path := null;

  if new.exhibition_id is null then
    return new;
  end if;

  select e.consignment_terms_text, e.consignment_terms_pdf_path
    into ex_text, ex_pdf
  from public.exhibitions e
  where e.id = new.exhibition_id;

  if ex_text is null and ex_pdf is null then
    return new;
  end if;

  if new.terms_ack is distinct from true then
    raise exception 'You need to agree to the consignment terms for this exhibition.'
      using errcode = '23514';
  end if;

  new.terms_agreed_at := now();
  new.terms_agreed_text := ex_text;
  new.terms_agreed_pdf_path := ex_pdf;
  return new;
end;
$$;

create trigger submissions_enforce_terms
  before insert on public.submissions
  for each row execute function public.submissions_enforce_terms();

-- ── Storage: terms PDFs ──────────────────────────────────────────────────
-- Path convention: {gallery_id}/{exhibition_id}/{timestamp}.pdf. Each upload
-- gets a new name and old files are kept, because a past agreement may point
-- at a superseded PDF. Private bucket; reads are limited to the gallery owner
-- and to signed-in users when the path is an exhibition's current terms or a
-- PDF they themselves agreed to.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exhibition-terms', 'exhibition-terms', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "exhibition_terms_select_owner" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'exhibition-terms'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

create policy "exhibition_terms_select_current" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'exhibition-terms'
    and exists (
      select 1 from public.exhibitions e
      where e.consignment_terms_pdf_path = storage.objects.name
    )
  );

create policy "exhibition_terms_select_agreed" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'exhibition-terms'
    and exists (
      select 1 from public.submissions s
      where s.terms_agreed_pdf_path = storage.objects.name
        and s.artist_id = (select auth.uid())
    )
  );

create policy "exhibition_terms_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'exhibition-terms'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

create policy "exhibition_terms_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'exhibition-terms'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );

create policy "exhibition_terms_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'exhibition-terms'
    and public.owns_gallery(((storage.foldername(name))[1])::uuid)
  );
