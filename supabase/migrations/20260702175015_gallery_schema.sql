-- Plinth gallery schema: multi-tenant tables for exhibitions, submissions,
-- catalogue, frameshop, contacts and messages, scoped to `galleries` rows
-- (one row per deployed portal, matched by NEXT_PUBLIC_GALLERY -> slug).

-- ── Tables ──────────────────────────────────────────────────────────────

create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  city text,
  commission_rate numeric(4,3) not null default 0.400,
  delivery_address text,
  drop_off_pass_prefix text,
  created_at timestamptz not null default now()
);

create table public.artist_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  practice text,
  city text,
  phone text,
  bank_name text,
  bank_account_number text,
  branch_code text,
  account_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  title text not null,
  dates_label text not null,
  status text not null default 'planning' check (status in ('open', 'planning', 'hanging', 'closed')),
  blurb text,
  slots integer not null default 0,
  submission_deadline date,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  exhibition_id uuid references public.exhibitions(id) on delete set null,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  title text not null,
  year integer,
  medium text,
  dim text,
  price numeric(12,2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'changes')),
  note text not null default '',
  ack boolean,
  statement text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.catalogue_works (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete set null,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  title text not null,
  price numeric(12,2),
  status text not null default 'available' check (status in ('available', 'sold', 'reserved', 'on loan')),
  created_at timestamptz not null default now()
);

create table public.frame_jobs (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete set null,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  title text not null,
  spec text,
  stage text not null default 'queued' check (stage in ('queued', 'building', 'ready')),
  due_date date,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('Artist', 'Collector')),
  focus text,
  last_contact_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete set null,
  sender text not null check (sender in ('gallery', 'artist')),
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ── Indexes ─────────────────────────────────────────────────────────────

create index exhibitions_gallery_id_idx on public.exhibitions(gallery_id);
create index submissions_gallery_id_idx on public.submissions(gallery_id);
create index submissions_exhibition_id_idx on public.submissions(exhibition_id);
create index submissions_artist_id_idx on public.submissions(artist_id);
create index catalogue_works_gallery_id_idx on public.catalogue_works(gallery_id);
create index catalogue_works_artist_id_idx on public.catalogue_works(artist_id);
create index frame_jobs_gallery_id_idx on public.frame_jobs(gallery_id);
create index frame_jobs_artist_id_idx on public.frame_jobs(artist_id);
create index contacts_gallery_id_idx on public.contacts(gallery_id);
create index messages_gallery_id_idx on public.messages(gallery_id);
create index messages_artist_id_idx on public.messages(artist_id);

-- ── Derived view: slots filled / applicants per exhibition ────────────────
-- security_invoker so the querying user's own RLS grants (not the view
-- owner's) decide which submissions get counted.

create view public.exhibition_counts
with (security_invoker = true) as
select
  e.id as exhibition_id,
  count(s.id) filter (where s.status = 'approved') as filled,
  count(s.id) as applicants
from public.exhibitions e
left join public.submissions s on s.exhibition_id = e.id
group by e.id;

-- ── New-user provisioning ──────────────────────────────────────────────
-- Gallery signups (role='gallery') get a `galleries` row auto-provisioned
-- from their signup metadata; artist signups/invites (role='artist') get an
-- `artist_profiles` row. JVH itself is seeded directly with a fixed slug,
-- not through this trigger.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  user_role text := meta->>'role';
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  if user_role = 'artist' then
    insert into public.artist_profiles (id, full_name, practice, city)
    values (new.id, meta->>'full_name', meta->>'practice', meta->>'city')
    on conflict (id) do nothing;
  elsif user_role = 'gallery' then
    base_slug := trim(both '-' from lower(regexp_replace(coalesce(meta->>'gallery_name', 'gallery'), '[^a-zA-Z0-9]+', '-', 'g')));
    if base_slug = '' then
      base_slug := 'gallery';
    end if;
    final_slug := base_slug;
    while exists (select 1 from public.galleries where slug = final_slug) loop
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    end loop;
    insert into public.galleries (owner_id, slug, name, city)
    values (new.id, final_slug, coalesce(meta->>'gallery_name', 'Untitled Gallery'), meta->>'city')
    on conflict (owner_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger artist_profiles_set_updated_at
  before update on public.artist_profiles
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────

alter table public.galleries enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.exhibitions enable row level security;
alter table public.submissions enable row level security;
alter table public.catalogue_works enable row level security;
alter table public.frame_jobs enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;

-- Tenant-scoping helper: true iff the current user owns the given gallery.
-- security definer + fixed search_path so it can't be hijacked; stable so
-- the planner can cache it once per statement.
create or replace function public.owns_gallery(check_gallery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.galleries g
    where g.id = check_gallery_id and g.owner_id = (select auth.uid())
  );
$$;

grant execute on function public.owns_gallery(uuid) to authenticated;

-- galleries: public directory info; only the owner can manage their row.
create policy "galleries_select_all" on public.galleries
  for select using (true);

create policy "galleries_insert_own" on public.galleries
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "galleries_update_own" on public.galleries
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "galleries_delete_own" on public.galleries
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- artist_profiles: artists manage their own row; a gallery owner can see
-- (name/practice/city only, enforced at the query layer) profiles of
-- artists who have a submission or message with *their* gallery.
create policy "artist_profiles_select_own" on public.artist_profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "artist_profiles_select_by_gallery" on public.artist_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.artist_id = artist_profiles.id and public.owns_gallery(s.gallery_id)
    )
    or exists (
      select 1 from public.messages m
      where m.artist_id = artist_profiles.id and public.owns_gallery(m.gallery_id)
    )
  );

create policy "artist_profiles_insert_own" on public.artist_profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "artist_profiles_update_own" on public.artist_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- exhibitions: public listing; only the owning gallery can manage.
create policy "exhibitions_select_all" on public.exhibitions
  for select using (true);

create policy "exhibitions_insert_owner" on public.exhibitions
  for insert to authenticated
  with check (public.owns_gallery(gallery_id));

create policy "exhibitions_update_owner" on public.exhibitions
  for update to authenticated
  using (public.owns_gallery(gallery_id))
  with check (public.owns_gallery(gallery_id));

create policy "exhibitions_delete_owner" on public.exhibitions
  for delete to authenticated
  using (public.owns_gallery(gallery_id));

-- submissions: visible to the owning gallery and the submitting artist.
create policy "submissions_select_owner_or_artist" on public.submissions
  for select to authenticated
  using (public.owns_gallery(gallery_id) or artist_id = (select auth.uid()));

create policy "submissions_insert_artist" on public.submissions
  for insert to authenticated
  with check (artist_id = (select auth.uid()));

create policy "submissions_update_owner" on public.submissions
  for update to authenticated
  using (public.owns_gallery(gallery_id))
  with check (public.owns_gallery(gallery_id));

-- Row-scoped, not column-scoped: the app only ever sends {ack: true} through
-- this path for a declined submission it owns. See plan notes.
create policy "submissions_update_artist_ack" on public.submissions
  for update to authenticated
  using (artist_id = (select auth.uid()) and status = 'declined')
  with check (artist_id = (select auth.uid()) and status = 'declined');

-- catalogue_works / frame_jobs / contacts: gallery-owner only, not
-- artist-visible in the current UI.
create policy "catalogue_select_owner" on public.catalogue_works
  for select to authenticated using (public.owns_gallery(gallery_id));
create policy "catalogue_insert_owner" on public.catalogue_works
  for insert to authenticated with check (public.owns_gallery(gallery_id));
create policy "catalogue_update_owner" on public.catalogue_works
  for update to authenticated using (public.owns_gallery(gallery_id)) with check (public.owns_gallery(gallery_id));
create policy "catalogue_delete_owner" on public.catalogue_works
  for delete to authenticated using (public.owns_gallery(gallery_id));

create policy "frame_jobs_select_owner" on public.frame_jobs
  for select to authenticated using (public.owns_gallery(gallery_id));
create policy "frame_jobs_insert_owner" on public.frame_jobs
  for insert to authenticated with check (public.owns_gallery(gallery_id));
create policy "frame_jobs_update_owner" on public.frame_jobs
  for update to authenticated using (public.owns_gallery(gallery_id)) with check (public.owns_gallery(gallery_id));
create policy "frame_jobs_delete_owner" on public.frame_jobs
  for delete to authenticated using (public.owns_gallery(gallery_id));

create policy "contacts_select_owner" on public.contacts
  for select to authenticated using (public.owns_gallery(gallery_id));
create policy "contacts_insert_owner" on public.contacts
  for insert to authenticated with check (public.owns_gallery(gallery_id));
create policy "contacts_update_owner" on public.contacts
  for update to authenticated using (public.owns_gallery(gallery_id)) with check (public.owns_gallery(gallery_id));
create policy "contacts_delete_owner" on public.contacts
  for delete to authenticated using (public.owns_gallery(gallery_id));

-- messages: gallery owner sees/sends for their gallery, artist sees/sends
-- their own.
create policy "messages_select" on public.messages
  for select to authenticated
  using (public.owns_gallery(gallery_id) or artist_id = (select auth.uid()));

create policy "messages_insert_gallery" on public.messages
  for insert to authenticated
  with check (sender = 'gallery' and public.owns_gallery(gallery_id));

create policy "messages_insert_artist" on public.messages
  for insert to authenticated
  with check (sender = 'artist' and artist_id = (select auth.uid()));

-- ── Storage: submission images ─────────────────────────────────────────
-- Path convention: {artist_id}/{submission_id}/{filename}. Public read
-- (art images aren't sensitive and the gallery needs to display them);
-- writes restricted to the artist whose uid matches the first path segment.

insert into storage.buckets (id, name, public, file_size_limit)
values ('submission-images', 'submission-images', true, 10485760)
on conflict (id) do nothing;

create policy "submission_images_select_all" on storage.objects
  for select using (bucket_id = 'submission-images');

create policy "submission_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submission-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "submission_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'submission-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "submission_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'submission-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
