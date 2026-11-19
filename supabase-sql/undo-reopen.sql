-- UNDO. Only if the website stops loading data after step 2 and Claude says
-- to run this. It puts the planner tables back the way they were before
-- step 2: row security on, with one rule that lets the public key do everything.
do $$
declare t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname not in ('mobile_session_tokens', 'token_revocations', 'user_settings')
  loop
    execute format('grant select, insert, update, delete on table public.%I to anon', t);
    execute format('drop policy if exists anon_all on public.%I', t);
    execute format('create policy anon_all on public.%I for all to anon using (true) with check (true)', t);
  end loop;
end $$;
