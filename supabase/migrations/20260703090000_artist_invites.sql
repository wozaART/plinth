-- Artist invites: tracks invitations a gallery sends to prospective artists.
-- Sending (Resend call) happens in the `send-artist-invite` edge function;
-- this table is what that function inserts into and what it's authorized
-- against via RLS (no service-role key needed — the function acts as the
-- calling gallery owner's own JWT).

create table public.artist_invites (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

create index artist_invites_gallery_id_idx on public.artist_invites(gallery_id);
create unique index artist_invites_token_idx on public.artist_invites(token);

-- Only one live invite per (gallery, email) at a time.
create unique index artist_invites_gallery_email_pending_idx
  on public.artist_invites(gallery_id, lower(email))
  where status = 'pending';

alter table public.artist_invites enable row level security;

create policy "artist_invites_select_owner" on public.artist_invites
  for select to authenticated
  using (public.owns_gallery(gallery_id));

create policy "artist_invites_insert_owner" on public.artist_invites
  for insert to authenticated
  with check (public.owns_gallery(gallery_id) and invited_by = (select auth.uid()));

create policy "artist_invites_update_owner" on public.artist_invites
  for update to authenticated
  using (public.owns_gallery(gallery_id))
  with check (public.owns_gallery(gallery_id));
