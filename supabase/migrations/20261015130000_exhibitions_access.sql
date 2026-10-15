-- Open vs closed exhibitions. An open exhibition takes submissions from any
-- artist in the gallery's portal (an open call). A closed exhibition is by
-- invitation only: artists can submit to it only after accepting an
-- exhibition invite. Existing exhibitions stay open.

alter table public.exhibitions
  add column access text not null default 'open' check (access in ('open', 'closed'));

drop policy "submissions_insert_artist" on public.submissions;

create policy "submissions_insert_artist" on public.submissions
  for insert to authenticated
  with check (
    artist_id = (select auth.uid())
    and (
      exhibition_id is null
      or exists (
        select 1 from public.exhibitions e
        where e.id = exhibition_id
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
