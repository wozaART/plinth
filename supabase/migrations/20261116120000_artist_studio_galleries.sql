-- Artist accounts live on the platform, not on one gallery's domain. The
-- studio used to show only the gallery its host resolved to, so an artist who
-- accepted a gallery's invite on woza.art (while that gallery's custom domain
-- was still unverified) never saw that gallery's open calls.
--
-- artist_gallery_ids() lists every gallery the signed-in artist has dealt
-- with, so the studio can load all of them whatever the host. Security
-- definer because artist_invites is only readable by the gallery owner; it
-- only ever answers for auth.uid(), and only returns gallery ids, which are
-- already public (galleries_select_all).

create function public.artist_gallery_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select u.id, lower(u.email) as email from auth.users u where u.id = (select auth.uid())
  )
  select i.gallery_id
  from public.artist_invites i, me
  where lower(i.email) = me.email and i.status = 'accepted'
  union
  select i.gallery_id
  from public.exhibition_invites i, me
  where (i.artist_id = me.id or lower(i.email) = me.email)
    and i.status in ('pending', 'accepted')
  union
  select s.gallery_id from public.submissions s, me where s.artist_id = me.id
  union
  select m.gallery_id from public.messages m, me where m.artist_id = me.id
  union
  select w.gallery_id from public.catalogue_works w, me where w.artist_id = me.id
  union
  select p.gallery_id from public.payouts p, me where p.artist_id = me.id;
$$;

revoke execute on function public.artist_gallery_ids() from public, anon;
grant execute on function public.artist_gallery_ids() to authenticated;

-- With the studio no longer tied to one gallery, the submission's gallery is
-- chosen per submission. When it is for an exhibition, it must be that
-- exhibition's gallery, otherwise a work could land in one gallery's inbox
-- against another gallery's exhibition. Otherwise unchanged from
-- 20261015130000_exhibitions_access.sql.
drop policy "submissions_insert_artist" on public.submissions;

create policy "submissions_insert_artist" on public.submissions
  for insert to authenticated
  with check (
    artist_id = (select auth.uid())
    and (
      exhibition_id is null
      or exists (
        select 1 from public.exhibitions e
        where e.id = submissions.exhibition_id
          and e.gallery_id = submissions.gallery_id
          and (e.submission_deadline is null or e.submission_deadline >= current_date)
          and (
            e.access = 'open'
            or exists (
              select 1 from public.exhibition_invites ei
              where ei.exhibition_id = e.id
                and ei.artist_id = (select auth.uid())
                and ei.status = 'accepted'
            )
          )
      )
    )
  );
