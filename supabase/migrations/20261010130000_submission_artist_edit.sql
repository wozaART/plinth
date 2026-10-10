-- Artists may edit a submission while the gallery hasn't made a final call:
-- 'pending' (awaiting review) and 'changes' (gallery asked for revisions).
-- Once a submission is approved (or declined) it is locked.
--
-- Same pattern as submissions_update_artist_ack: a security-definer
-- function that can only touch the artist-editable columns, instead of a
-- row-scoped UPDATE policy that would let an artist rewrite status/note.

create or replace function public.submissions_update_artist_edit(
  p_submission_id uuid,
  p_title text,
  p_medium text,
  p_dim text,
  p_year integer,
  p_price numeric,
  p_statement text,
  p_image_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions
  set title = p_title,
      medium = p_medium,
      dim = p_dim,
      year = p_year,
      price = p_price,
      statement = p_statement,
      image_url = coalesce(p_image_url, image_url),
      -- Resubmitting after a change request puts it back in the review queue.
      status = 'pending'
  where id = p_submission_id
    and artist_id = (select auth.uid())
    and status in ('pending', 'changes');

  if not found then
    raise exception 'This submission can no longer be edited.';
  end if;
end;
$$;

grant execute on function public.submissions_update_artist_edit(uuid, text, text, text, integer, numeric, text, text) to authenticated;

-- Storage: an artist can only add, replace or remove images for submissions
-- that are still editable (or that don't exist yet, i.e. a brand-new
-- submission being created). Path: {artist_id}/{submission_id}/{filename}.
create or replace function public.submission_image_writable(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.submissions s
    where s.id::text = (storage.foldername(p_name))[2]
      and s.status not in ('pending', 'changes')
  );
$$;

drop policy "submission_images_insert_own" on storage.objects;
drop policy "submission_images_update_own" on storage.objects;
drop policy "submission_images_delete_own" on storage.objects;

create policy "submission_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submission-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and public.submission_image_writable(name)
  );

create policy "submission_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'submission-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and public.submission_image_writable(name)
  );

create policy "submission_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'submission-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and public.submission_image_writable(name)
  );
