-- UNDO. Only if the website stops loading data after step 2 and Claude says
-- to run this. It puts access back the way it was before step 2.
do $$
declare t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname not in ('mobile_session_tokens', 'token_revocations', 'user_settings')
  loop
    execute format('alter table public.%I disable row level security', t);
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated', t);
  end loop;
end $$;
