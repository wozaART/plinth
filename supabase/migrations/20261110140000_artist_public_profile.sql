-- Artist public profile: a short bio, up to 10 portfolio works, social /
-- website links, and a profile photo plus studio photos. Artists manage their
-- own rows; a gallery can read them once it has dealt with the artist (same
-- relationship test as artist_profiles_select_by_gallery).

alter table public.artist_profiles
  add column bio text check (bio is null or char_length(bio) <= 2000);

-- ── Gallery visibility ──────────────────────────────────────────────────
-- Invoker rights on purpose: the submissions / messages RLS policies still
-- apply, so this only ever sees rows the calling gallery owner may see.
create function public.gallery_can_view_artist(target_artist_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.submissions s
    where s.artist_id = target_artist_id and public.owns_gallery(s.gallery_id)
  ) or exists (
    select 1 from public.messages m
    where m.artist_id = target_artist_id and public.owns_gallery(m.gallery_id)
  );
$$;

grant execute on function public.gallery_can_view_artist(uuid) to authenticated;

-- ── Tables ──────────────────────────────────────────────────────────────
create table public.artist_portfolio_works (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  year integer check (year is null or year between 1000 and 3000),
  medium text check (medium is null or char_length(medium) <= 200),
  dimensions text check (dimensions is null or char_length(dimensions) <= 100),
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.artist_links (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  kind text not null check (kind in (
    'website', 'instagram', 'facebook', 'x', 'tiktok', 'youtube', 'linkedin', 'behance', 'other'
  )),
  url text not null check (url ~* '^https?://[^\s]+$' and char_length(url) <= 500),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.artist_photos (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  kind text not null check (kind in ('profile', 'studio')),
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index artist_portfolio_works_artist_id_idx on public.artist_portfolio_works(artist_id, position);
create index artist_links_artist_id_idx on public.artist_links(artist_id, position);
create index artist_photos_artist_id_idx on public.artist_photos(artist_id, kind, position);
-- One profile photo per artist; replacing it is a delete + insert.
create unique index artist_photos_one_profile_idx on public.artist_photos(artist_id) where kind = 'profile';

-- ── Limits ──────────────────────────────────────────────────────────────
-- Enforced here, not just in the UI. Locking the artist row serialises
-- concurrent inserts so two requests can't both slip under the cap.
create function public.enforce_artist_profile_limits()
returns trigger
language plpgsql
as $$
declare
  max_rows integer;
  current_rows integer;
begin
  perform 1 from public.artist_profiles where id = new.artist_id for update;

  if tg_table_name = 'artist_portfolio_works' then
    max_rows := 10;
    select count(*) into current_rows from public.artist_portfolio_works where artist_id = new.artist_id;
  elsif tg_table_name = 'artist_links' then
    max_rows := 10;
    select count(*) into current_rows from public.artist_links where artist_id = new.artist_id;
  elsif tg_table_name = 'artist_photos' and new.kind = 'studio' then
    max_rows := 6;
    select count(*) into current_rows from public.artist_photos where artist_id = new.artist_id and kind = 'studio';
  else
    return new;
  end if;

  if current_rows >= max_rows then
    raise exception 'Limit of % reached.', max_rows using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger artist_portfolio_works_limit before insert on public.artist_portfolio_works
  for each row execute function public.enforce_artist_profile_limits();
create trigger artist_links_limit before insert on public.artist_links
  for each row execute function public.enforce_artist_profile_limits();
create trigger artist_photos_limit before insert on public.artist_photos
  for each row execute function public.enforce_artist_profile_limits();

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table public.artist_portfolio_works enable row level security;
alter table public.artist_links enable row level security;
alter table public.artist_photos enable row level security;

create policy "artist_portfolio_works_select" on public.artist_portfolio_works
  for select to authenticated
  using (artist_id = (select auth.uid()) or public.gallery_can_view_artist(artist_id));
create policy "artist_portfolio_works_insert_own" on public.artist_portfolio_works
  for insert to authenticated with check (artist_id = (select auth.uid()));
create policy "artist_portfolio_works_update_own" on public.artist_portfolio_works
  for update to authenticated
  using (artist_id = (select auth.uid())) with check (artist_id = (select auth.uid()));
create policy "artist_portfolio_works_delete_own" on public.artist_portfolio_works
  for delete to authenticated using (artist_id = (select auth.uid()));

create policy "artist_links_select" on public.artist_links
  for select to authenticated
  using (artist_id = (select auth.uid()) or public.gallery_can_view_artist(artist_id));
create policy "artist_links_insert_own" on public.artist_links
  for insert to authenticated with check (artist_id = (select auth.uid()));
create policy "artist_links_update_own" on public.artist_links
  for update to authenticated
  using (artist_id = (select auth.uid())) with check (artist_id = (select auth.uid()));
create policy "artist_links_delete_own" on public.artist_links
  for delete to authenticated using (artist_id = (select auth.uid()));

create policy "artist_photos_select" on public.artist_photos
  for select to authenticated
  using (artist_id = (select auth.uid()) or public.gallery_can_view_artist(artist_id));
create policy "artist_photos_insert_own" on public.artist_photos
  for insert to authenticated with check (artist_id = (select auth.uid()));
create policy "artist_photos_update_own" on public.artist_photos
  for update to authenticated
  using (artist_id = (select auth.uid())) with check (artist_id = (select auth.uid()));
create policy "artist_photos_delete_own" on public.artist_photos
  for delete to authenticated using (artist_id = (select auth.uid()));

-- ── Storage ─────────────────────────────────────────────────────────────
-- Path convention: {artist_id}/{row_id}/{filename}. Public read like
-- submission-images (the rows that point at the files are what's gated);
-- writes limited to the artist whose uid is the first path segment.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artist-profile-images', 'artist-profile-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'])
on conflict (id) do nothing;

create policy "artist_profile_images_select_all" on storage.objects
  for select using (bucket_id = 'artist-profile-images');

create policy "artist_profile_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'artist-profile-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "artist_profile_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'artist-profile-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "artist_profile_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'artist-profile-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- ── Atomic link replacement ─────────────────────────────────────────────
-- The links editor saves the whole list at once; doing it in one function
-- means a failed insert (bad URL, over the cap) rolls the delete back too.
-- Invoker rights: RLS and the limit trigger still apply.
create function public.replace_artist_links(p_links jsonb)
returns void
language plpgsql
as $$
begin
  delete from public.artist_links where artist_id = (select auth.uid());
  insert into public.artist_links (artist_id, kind, url, position)
  select (select auth.uid()), l.e ->> 'kind', l.e ->> 'url', (l.ord - 1)::integer
  from jsonb_array_elements(p_links) with ordinality as l(e, ord);
end;
$$;

grant execute on function public.replace_artist_links(jsonb) to authenticated;
