-- Store the pre-change row on updates so the activity log can show what changed.

alter table public.audit_log add column old_record jsonb;

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

  insert into public.audit_log (gallery_id, table_name, record_id, action, actor_id, actor_email, record, old_record)
  values (
    v_gallery_id,
    tg_table_name,
    v_record_id,
    lower(tg_op),
    auth.uid(),
    v_actor_email,
    case tg_op when 'DELETE' then to_jsonb(old) else to_jsonb(new) end,
    case tg_op when 'UPDATE' then to_jsonb(old) else null end
  );

  return coalesce(new, old);
end;
$$;
