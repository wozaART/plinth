-- The backfill in 20261008120001_gallery_theming_backfill.sql was edited after
-- it had already run against the live database, so the "default" gallery's
-- logo_wordmark_primary is still stuck on the pre-rename value. Fix the data
-- directly instead of relying on the (already-applied) old migration text.
update public.galleries
set logo_wordmark_primary = 'Woza Art'
where slug = 'default'
  and logo_wordmark_primary = 'Plinth';
