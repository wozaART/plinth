-- Contacts are keyed by email, not artist id, so opening an artist contact's
-- profile needs an email -> artist lookup. Security definer because galleries
-- can't read auth.users; it only answers for the caller's own contacts, and
-- only for artists the gallery has dealt with (same test as the profile
-- tables' RLS), so it can't be used to probe who has an account.
create function public.get_contact_artist_id(p_contact_id uuid)
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
    and (
      exists (select 1 from public.submissions s where s.artist_id = a.id and s.gallery_id = c.gallery_id)
      or exists (select 1 from public.messages m where m.artist_id = a.id and m.gallery_id = c.gallery_id)
    )
  limit 1;
$$;

grant execute on function public.get_contact_artist_id(uuid) to authenticated;
