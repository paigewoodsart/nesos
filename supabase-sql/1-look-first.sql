-- STEP 1: LOOK FIRST. Changes nothing.
-- Shows every table, who can reach it, any access rules, and file storage.
-- Run this, then send Claude a screenshot of the results.
select 'table' as kind, c.relname as name,
       'row security=' || c.relrowsecurity::text as detail
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
union all
select 'access', table_name,
       grantee || ': ' || string_agg(privilege_type, ', ' order by privilege_type)
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
group by table_name, grantee
union all
select 'rule', schemaname || '.' || tablename,
       policyname || ' (' || cmd || ' for ' || array_to_string(roles, ',') || ')'
from pg_policies
where schemaname in ('public', 'storage')
union all
select 'file bucket', name, 'public=' || public::text
from storage.buckets
order by 1, 2;
