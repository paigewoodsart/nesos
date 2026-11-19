-- STEP 2: CLOSE THE DOOR. Run only after the updated website is live and
-- you have checked that your planner still loads and saves.
--
-- After this, the planner tables and the uploaded files can only be reached
-- by the website's own server, which checks who is signed in. The public key
-- can no longer read or change anything. No data is deleted.
do $$
declare
  t text;
  p record;
begin
  -- The "anon_all" rules let the public key do everything. Remove them.
  for p in select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;

  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;

  -- Same for uploaded files: remove the four "allow_all" rules. The website
  -- uses its server key and short-lived signed links, which need no rules.
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects' and policyname like 'allow_all%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- Tables made in future start closed too.
alter default privileges in schema public revoke all on tables from anon, authenticated;
