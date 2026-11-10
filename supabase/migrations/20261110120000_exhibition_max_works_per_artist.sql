-- Replace the exhibition "slots" count with a per-artist limit: the most
-- works any one artist may submit to the exhibition. NULL means no limit.
-- Old slot counts described the whole show, not one artist, so they are not
-- carried over.

alter table public.exhibitions rename column slots to max_works_per_artist;
alter table public.exhibitions alter column max_works_per_artist drop not null;
alter table public.exhibitions alter column max_works_per_artist drop default;
update public.exhibitions set max_works_per_artist = null;
alter table public.exhibitions
  add constraint exhibitions_max_works_per_artist_positive check (max_works_per_artist is null or max_works_per_artist >= 1);
