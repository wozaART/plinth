-- Custom domain attachment: lets a gallery point their own domain at their
-- Woza Art portal. Status is tracked separately from the domain name itself
-- so the UI can show "pending verification" while Vercel propagates DNS.

alter table public.galleries
  add column custom_domain text unique,
  add column domain_status text not null default 'none'
    check (domain_status in ('none', 'pending', 'verified', 'error'));
