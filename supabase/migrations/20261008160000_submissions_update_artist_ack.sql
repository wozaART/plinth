-- Tighten the artist "I acknowledge this decline" action so it can only
-- ever change the `ack` column, instead of relying on the app only ever
-- sending {ack: true} through a row-scoped (but otherwise unrestricted)
-- UPDATE policy. The Phase 3 payout acknowledgement will copy this
-- function pattern, so fix it here first.

drop policy "submissions_update_artist_ack" on public.submissions;

create or replace function public.submissions_update_artist_ack(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions
  set ack = true
  where id = p_submission_id
    and artist_id = (select auth.uid())
    and status = 'declined';

  if not found then
    raise exception 'This submission could not be acknowledged.';
  end if;
end;
$$;

grant execute on function public.submissions_update_artist_ack(uuid) to authenticated;
