-- Per-gallery sender identity for outgoing email. The local part is combined
-- with the platform mail domain (MAIL_DOMAIN env) to build the From address;
-- replies go to reply_to_email so artists reach a real inbox. NULLs fall back
-- to the platform-wide sender.

alter table public.galleries
  add column mail_local_part text unique
    check (mail_local_part ~ '^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$'),
  add column reply_to_email text
    check (reply_to_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');
