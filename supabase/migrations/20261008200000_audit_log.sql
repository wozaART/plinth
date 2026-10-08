-- Audit log: records every create/update/delete on exhibitions, contacts, and
-- catalogue works (artworks), so gallery admins can see who changed what and when.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  record jsonb not null,
  created_at timestamptz not null default now()
);

create index audit_log_gallery_id_idx on public.audit_log(gallery_id, created_at desc);

alter table public.audit_log enable row level security;

-- Only the gallery owner can read their own audit trail. There are no
-- insert/update/delete policies: all writes happen via the security-definer
-- trigger below, the same pattern used by record_sale() for the sales table.
create policy "audit_log_select_owner" on public.audit_log
  for select to authenticated
  using (public.owns_gallery(gallery_id));

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gallery_id uuid;
  v_record_id uuid;
  v_actor_email text;
begin
  if tg_op = 'DELETE' then
    v_gallery_id := old.gallery_id;
    v_record_id := old.id;
  else
    v_gallery_id := new.gallery_id;
    v_record_id := new.id;
  end if;

  select email into v_actor_email from auth.users where id = auth.uid();

  insert into public.audit_log (gallery_id, table_name, record_id, action, actor_id, actor_email, record)
  values (
    v_gallery_id,
    tg_table_name,
    v_record_id,
    lower(tg_op),
    auth.uid(),
    v_actor_email,
    case tg_op when 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

create trigger exhibitions_audit
  after insert or update or delete on public.exhibitions
  for each row execute function public.log_audit_event();

create trigger contacts_audit
  after insert or update or delete on public.contacts
  for each row execute function public.log_audit_event();

create trigger catalogue_works_audit
  after insert or update or delete on public.catalogue_works
  for each row execute function public.log_audit_event();
