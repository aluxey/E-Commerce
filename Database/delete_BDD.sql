begin;

drop schema if exists public cascade;
create schema public;

-- ACL minimales standard Supabase
grant usage on schema public to public;
grant create on schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;

commit;
