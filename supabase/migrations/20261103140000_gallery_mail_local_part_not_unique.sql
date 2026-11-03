-- Sender addresses now live on each gallery's own domain, so two galleries can
-- both use the same local part (e.g. hello@). Uniqueness was only needed while
-- every gallery shared one mail domain.

alter table public.galleries
  drop constraint if exists galleries_mail_local_part_key;
