-- Ensure current_version column exists in projects table
begin;

-- Add current_version column if it doesn't exist
alter table public.projects 
  add column if not exists current_version integer default 10; -- v0.1.0

-- Update any existing projects that don't have a current_version set
update public.projects 
set current_version = 10 
where current_version is null;

commit;