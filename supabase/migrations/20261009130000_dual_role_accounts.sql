-- One account can be both a gallery owner and an artist.
--
-- accept_artist_invite used to force raw_user_meta_data.role = 'artist',
-- which demoted a gallery owner redeeming an invite sent to their own email:
-- the gallery-only server actions (role = 'gallery') started rejecting them.
-- Accepting an invite now only *adds* the artist_profiles row; the role is
-- set to 'artist' only when the account has no role yet (OAuth signups).
-- Studio access is gated on the artist_profiles row, not on the role.

create or replace function public.accept_artist_invite(p_token uuid)
returns table (gallery_id uuid, gallery_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.artist_invites%rowtype;
  v_user_email text;
  v_user_full_name text;
  v_gallery_name text;
begin
  select email into v_user_email from auth.users where id = auth.uid();
  if v_user_email is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_invite
  from public.artist_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'This invite could not be found.';
  end if;

  if v_invite.status = 'pending' and v_invite.expires_at < now() then
    update public.artist_invites set status = 'expired' where id = v_invite.id;
    v_invite.status := 'expired';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'This invite is % and can no longer be accepted.', v_invite.status;
  end if;

  if lower(v_invite.email) <> lower(v_user_email) then
    raise exception 'This invite was sent to a different email address.';
  end if;

  select raw_user_meta_data->>'full_name' into v_user_full_name from auth.users where id = auth.uid();

  update auth.users
  set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'artist')
  where id = auth.uid() and coalesce(raw_user_meta_data->>'role', '') = '';

  insert into public.artist_profiles (id, full_name)
  values (auth.uid(), coalesce(v_invite.full_name, v_user_full_name))
  on conflict (id) do nothing;

  update public.artist_invites
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;

  select name into v_gallery_name from public.galleries where id = v_invite.gallery_id;

  return query select v_invite.gallery_id, v_gallery_name;
end;
$$;

grant execute on function public.accept_artist_invite(uuid) to authenticated;
