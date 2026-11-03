-- Sending email from a gallery's own custom domain. The domain itself is
-- galleries.custom_domain; this tracks its Resend registration. Until it is
-- verified, mail keeps going out from the platform mail domain.

alter table public.galleries
  add column resend_domain_id text,
  add column mail_domain_status text not null default 'none'
    check (mail_domain_status in ('none', 'pending', 'verified', 'error'));
