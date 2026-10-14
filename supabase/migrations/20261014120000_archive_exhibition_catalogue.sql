-- Archiving an exhibition now requires the gallery to decide what happens to
-- each of its submissions: approved ones can be accepted into the catalogue,
-- everything else is archived with the exhibition. Catalogue works carry no
-- exhibition of their own, so once accepted they stand apart from it.

alter table public.submissions
  add column archived_at timestamptz;

-- ── archive_exhibition ──────────────────────────────────────────────────
-- Creates the catalogue works, archives the remaining submissions and flips
-- the exhibition to `archived` in one transaction, so a failure part-way
-- can't leave an archived exhibition with its submissions unresolved.
-- Security definer with an explicit owner check, like record_sale.

create or replace function public.archive_exhibition(
  p_exhibition_id uuid,
  p_catalogue_submission_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gallery_id uuid;
  v_commission_rate numeric(4,3);
begin
  select e.gallery_id into v_gallery_id
  from public.exhibitions e
  where e.id = p_exhibition_id
  for update;

  if not found or not public.owns_gallery(v_gallery_id) then
    raise exception 'This exhibition could not be found.';
  end if;

  if exists (
    select 1
    from unnest(p_catalogue_submission_ids) as picked(id)
    where not exists (
      select 1 from public.submissions s
      where s.id = picked.id
        and s.exhibition_id = p_exhibition_id
        and s.status = 'approved'
    )
  ) then
    raise exception 'Only approved submissions from this exhibition can go into the catalogue.';
  end if;

  select g.commission_rate into v_commission_rate
  from public.galleries g
  where g.id = v_gallery_id;

  insert into public.catalogue_works (
    gallery_id, artist_id, submission_id, title, price, agreed_price,
    commission_rate, consigned_at, status
  )
  select
    s.gallery_id, s.artist_id, s.id, s.title, s.price, s.price,
    v_commission_rate, current_date, 'available'
  from public.submissions s
  where s.id = any(p_catalogue_submission_ids)
  on conflict (submission_id) do nothing;

  -- Anything not in the catalogue (picked now or earlier) is archived.
  update public.submissions s
  set archived_at = now()
  where s.exhibition_id = p_exhibition_id
    and s.archived_at is null
    and not exists (
      select 1 from public.catalogue_works cw where cw.submission_id = s.id
    );

  update public.exhibitions set status = 'archived' where id = p_exhibition_id;
end;
$$;

grant execute on function public.archive_exhibition(uuid, uuid[]) to authenticated;
