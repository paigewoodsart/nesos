-- STEP 3: CHECK. Changes nothing.
-- Every row should read: public_can_read = false, public_can_write = false,
-- row_security_on = true, server_can_read = true.
select c.relname as table_name,
       has_table_privilege('anon', c.oid, 'select') as public_can_read,
       has_table_privilege('anon', c.oid, 'insert') as public_can_write,
       c.relrowsecurity as row_security_on,
       has_table_privilege('service_role', c.oid, 'select') as server_can_read
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;
