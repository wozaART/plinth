-- Artist invite acceptance: lets an unauthenticated visitor look up an
-- invite by its (unguessable uuid) token, and lets a freshly authenticated
-- artist (via password signup or OAuth) redeem it. Both are security
-- definer so they can operate before/across the normal owns_gallery RLS,
-- the same pattern already used by public.owns_gallery / handle_new_user.

-- Public, token-gated read of just enough to render the invite screen.
-- No auth required — the token itself is the capability.
create or replace function public.get_artist_invite(p_token uuid)
returns table (
  email text,
  full_name text,
  gallery_name text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select ai.email, ai.full_name, g.name, ai.status, ai.expires_at
  from public.artist_invites ai
  join public.galleries g on g.id = ai.gallery_id
  where ai.token = p_token;
$$;

grant execute on function public.get_artist_invite(uuid) to anon, authenticated;

-- Redeems an invite for the *currently authenticated* user (password
-- signup or OAuth — either way, a session must already exist). Promotes
-- the account to role='artist' (OAuth signups never get to set this via
-- their own metadata, unlike password signup), provisions artist_profiles
-- if the on_auth_user_created trigger didn't already, and marks the
-- invite accepted. Requires the signed-in email to match the invited
-- email so a leaked token can't be redeemed against an unrelated account.
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
  where id = auth.uid() and (raw_user_meta_data->>'role') is distinct from 'artist';

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
