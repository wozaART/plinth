-- Any submission of the exhibition can be picked for the catalogue, not only
-- approved ones: the gallery decides what goes in when archiving.

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
    )
  ) then
    raise exception 'Only submissions from this exhibition can go into the catalogue.';
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
