-- Artists edit their public profile (portfolio, links, photos) and bank
-- details on the studio's Profile tab, so it can't stay hidden. Turn it on
-- for every gallery that has it disabled.
update public.galleries
set studio_tabs = (
  select jsonb_agg(
    case when t.tab ->> 'id' = 'profile' then t.tab || '{"enabled": true}'::jsonb else t.tab end
    order by t.ord
  )
  from jsonb_array_elements(studio_tabs) with ordinality as t(tab, ord)
)
where exists (
  select 1 from jsonb_array_elements(studio_tabs) x
  where x ->> 'id' = 'profile' and (x ->> 'enabled')::boolean is not true
);
