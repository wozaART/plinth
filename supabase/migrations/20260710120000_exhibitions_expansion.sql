-- Exhibitions expansion: group/solo type, theme/medium/size requirements,
-- rules, structured dates (replacing the free-text dates_label), an
-- 'archived' status, and a new exhibition_invites table for curator-
-- initiated artist participation (separate from the gallery-wide
-- artist_invites portal invites).

-- ── exhibitions: new columns ───────────────────────────────────────────

alter table public.exhibitions
  add column type text not null default 'group' check (type in ('group', 'solo')),
  add column theme text,
  add column medium_requirements text,
  add column size_requirements text,
  add column rules text,
  add column opening_date date,
  add column closing_date date,
  add column delivery_date date;

alter table public.exhibitions drop column dates_label;

alter table public.exhibitions drop constraint exhibitions_status_check;
alter table public.exhibitions
  add constraint exhibitions_status_check check (status in ('open', 'planning', 'hanging', 'closed', 'archived'));

-- ── submissions: rules acknowledgment ───────────────────────────────────
-- Distinct from the existing `ack` column, which acknowledges a decline.
-- Set once at insert time by createSubmission — no separate RLS needed.

alter table public.submissions add column rules_ack boolean;

-- ── exhibition_invites ──────────────────────────────────────────────────
-- Curator-initiated invitations to participate in a specific exhibition.
-- Unlike artist_invites (gallery-wide portal access), this tracks
-- per-exhibition participation and can target an existing artist_profiles
-- row or an accountless email address (artist_id backfilled on accept).

create table public.exhibition_invites (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  artist_id uuid references public.artist_profiles(id) on delete cascade,
  email text not null,
  full_name text,
  message text,
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  responded_at timestamptz
);

create index exhibition_invites_gallery_id_idx on public.exhibition_invites(gallery_id);
create index exhibition_invites_exhibition_id_idx on public.exhibition_invites(exhibition_id);
create index exhibition_invites_artist_id_idx on public.exhibition_invites(artist_id);
create unique index exhibition_invites_token_idx on public.exhibition_invites(token);

-- Only one live invite per (exhibition, email) at a time.
create unique index exhibition_invites_exhibition_email_pending_idx
  on public.exhibition_invites(exhibition_id, lower(email))
  where status = 'pending';

alter table public.exhibition_invites enable row level security;

-- An invite addressed to an artist who already has an account is matched
-- by email until they respond (artist_id stays null so a signed-in-but-
-- not-yet-accepted artist still needs to *see* it in their studio). The
-- email match reads from the JWT claim, not auth.users, since that table
-- isn't directly queryable under RLS.
create policy "exhibition_invites_select_owner_or_artist" on public.exhibition_invites
  for select to authenticated
  using (
    public.owns_gallery(gallery_id)
    or artist_id = (select auth.uid())
    or lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create policy "exhibition_invites_insert_owner" on public.exhibition_invites
  for insert to authenticated
  with check (public.owns_gallery(gallery_id) and invited_by = (select auth.uid()));

create policy "exhibition_invites_update_owner" on public.exhibition_invites
  for update to authenticated
  using (public.owns_gallery(gallery_id))
  with check (public.owns_gallery(gallery_id));

-- Artist-side respond: lets an invited artist (matched by their own uid or
-- their signed-in email) flip a pending invite to accepted/declined. The
-- app sets artist_id = auth.uid() as part of the same update so future
-- lookups by artist_id succeed.
create policy "exhibition_invites_update_artist_respond" on public.exhibition_invites
  for update to authenticated
  using (
    (artist_id = (select auth.uid()) or lower(email) = lower((select auth.jwt() ->> 'email')))
    and status = 'pending'
  )
  with check (
    artist_id = (select auth.uid())
    and status in ('accepted', 'declined')
  );

-- ── exhibition_invites acceptance (accountless-invitee path) ───────────
-- Mirrors get_artist_invite / accept_artist_invite: public token-gated read
-- plus a security-definer redeem for the currently authenticated user.

create or replace function public.get_exhibition_invite(p_token uuid)
returns table (
  email text,
  full_name text,
  exhibition_title text,
  exhibition_theme text,
  exhibition_rules text,
  gallery_name text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select ei.email, ei.full_name, e.title, e.theme, e.rules, g.name, ei.status, ei.expires_at
  from public.exhibition_invites ei
  join public.exhibitions e on e.id = ei.exhibition_id
  join public.galleries g on g.id = ei.gallery_id
  where ei.token = p_token;
$$;

grant execute on function public.get_exhibition_invite(uuid) to anon, authenticated;

create or replace function public.accept_exhibition_invite(p_token uuid)
returns table (exhibition_id uuid, gallery_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.exhibition_invites%rowtype;
  v_user_email text;
  v_user_full_name text;
  v_gallery_name text;
begin
  select email into v_user_email from auth.users where id = auth.uid();
  if v_user_email is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_invite
  from public.exhibition_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'This invite could not be found.';
  end if;

  if v_invite.status = 'pending' and v_invite.expires_at < now() then
    update public.exhibition_invites set status = 'expired' where id = v_invite.id;
    v_invite.status := 'expired';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'This invite is % and can no longer be accepted.', v_invite.status;
  end if;

  if lower(v_invite.email) <> lower(v_user_email) then
    raise exception 'This invite was sent to a different email address.';
  end if;

  select raw_user_meta_data->>'full_name' into v_user_full_name from auth.users where id = auth.uid();

  insert into public.artist_profiles (id, full_name)
  values (auth.uid(), coalesce(v_invite.full_name, v_user_full_name))
  on conflict (id) do nothing;

  update public.exhibition_invites
  set status = 'accepted', responded_at = now(), artist_id = coalesce(v_invite.artist_id, auth.uid())
  where id = v_invite.id;

  select name into v_gallery_name from public.galleries where id = v_invite.gallery_id;

  return query select v_invite.exhibition_id, v_gallery_name;
end;
$$;

grant execute on function public.accept_exhibition_invite(uuid) to authenticated;
