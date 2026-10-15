-- Artists can no longer submit to an exhibition once its online submission
-- deadline has passed. The deadline day itself is still open. Exhibitions
-- without a deadline, and submissions without an exhibition, are unaffected.

drop policy "submissions_insert_artist" on public.submissions;

create policy "submissions_insert_artist" on public.submissions
  for insert to authenticated
  with check (
    artist_id = (select auth.uid())
    and (
      exhibition_id is null
      or not exists (
        select 1 from public.exhibitions e
        where e.id = exhibition_id
          and e.submission_deadline is not null
          and e.submission_deadline < current_date
      )
    )
  );
