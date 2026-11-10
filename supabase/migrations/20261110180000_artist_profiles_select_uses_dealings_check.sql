-- Same relationship test as the portfolio/links/photos tables, so an artist
-- who accepted a gallery's invite is readable (name, city, bio) before they
-- submit or message. Bank details live in their own table and are unaffected.
drop policy "artist_profiles_select_by_gallery" on public.artist_profiles;

create policy "artist_profiles_select_by_gallery" on public.artist_profiles
  for select to authenticated
  using (public.gallery_can_view_artist(id));
