-- An artist who accepted a gallery's invite has dealt with that gallery even
-- before submitting work or messaging, so the gallery may view their public
-- profile. Invites are keyed by email, so matching needs auth.users: both
-- functions become security definer, and both only ever answer for galleries
-- the caller owns (owns_gallery checks auth.uid()).

create or replace function public.gallery_can_view_artist(target_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.submissions s
    where s.artist_id = target_artist_id and public.owns_gallery(s.gallery_id)
  ) or exists (
    select 1 from public.messages m
    where m.artist_id = target_artist_id and public.owns_gallery(m.gallery_id)
  ) or exists (
    select 1
    from public.artist_invites i
    join auth.users u on lower(u.email) = lower(i.email)
    where u.id = target_artist_id
      and i.status = 'accepted'
      and public.owns_gallery(i.gallery_id)
  );
$$;

create or replace function public.get_contact_artist_id(p_contact_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.id
  from public.contacts c
  join auth.users u on lower(u.email) = lower(c.email)
  join public.artist_profiles a on a.id = u.id
  where c.id = p_contact_id
    and c.role = 'Artist'
    and public.owns_gallery(c.gallery_id)
    and public.gallery_can_view_artist(a.id)
  limit 1;
$$;
