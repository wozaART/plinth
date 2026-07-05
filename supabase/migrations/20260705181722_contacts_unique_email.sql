-- One contact per (gallery, email) — mirrors the pending-invite uniqueness
-- guard already in place for artist_invites.
create unique index contacts_gallery_email_idx
  on public.contacts(gallery_id, lower(email));
