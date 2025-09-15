-- Add document versioning system
-- Creates tables for version management and document history

begin;

-- Create document_versions table (if not exists)
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  version_number integer not null,
  content jsonb not null,
  summary text,
  word_count integer default 0,
  created_at timestamptz default now(),
  created_by uuid,
  
  -- Constraints
  constraint document_versions_project_id_version_number_key unique (project_id, version_number),
  constraint document_versions_version_number_positive check (version_number > 0),
  constraint document_versions_word_count_positive check (word_count >= 0)
);

-- Add missing columns if they don't exist
alter table public.document_versions 
  add column if not exists is_milestone boolean default false,
  add column if not exists tags text[];

-- Add foreign key constraints (if projects table exists and constraint doesn't exist)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'projects' and table_schema = 'public') 
     and not exists (select 1 from information_schema.table_constraints 
                     where constraint_name = 'document_versions_project_id_fkey' 
                     and table_name = 'document_versions' 
                     and table_schema = 'public') then
    alter table public.document_versions 
      add constraint document_versions_project_id_fkey 
      foreign key (project_id) references public.projects(id) on delete cascade;
  end if;
end $$;

-- Add indexes for performance
create index if not exists document_versions_project_id_idx on public.document_versions(project_id);
create index if not exists document_versions_created_at_idx on public.document_versions(created_at);
create index if not exists document_versions_version_number_idx on public.document_versions(project_id, version_number);
create index if not exists document_versions_is_milestone_idx on public.document_versions(project_id, is_milestone) where is_milestone = true;

-- Enable RLS (Row Level Security)
alter table public.document_versions enable row level security;

-- Create RLS policies (basic user access - adjust as needed for your auth system)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view versions of their projects' and tablename = 'document_versions') then
    create policy "Users can view versions of their projects" on public.document_versions
      for select using (
        exists (
          select 1 from public.projects 
          where projects.id = document_versions.project_id 
          and projects.user_id = auth.uid()
        )
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can create versions for their projects' and tablename = 'document_versions') then
    create policy "Users can create versions for their projects" on public.document_versions
      for insert with check (
        exists (
          select 1 from public.projects 
          where projects.id = document_versions.project_id 
          and projects.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Add version column to projects table for current version tracking
alter table if exists public.projects
  add column if not exists current_version integer default 10; -- v0.1.0

-- Add version column to documents table for current version tracking  
alter table if exists public.documents
  add column if not exists current_version integer default 10; -- v0.1.0

-- Function to increment version number for a project
create or replace function public.get_next_version_number(project_uuid uuid)
returns integer
language plpgsql
security definer
as $$
declare
  next_version integer;
begin
  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.document_versions
  where project_id = project_uuid;
  
  return next_version;
end;
$$;

-- Function to update project version when a new version is created
create or replace function public.update_project_version()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Update current_version in projects table
  update public.projects 
  set current_version = new.version_number
  where id = new.project_id;
  
  return new;
end;
$$;

-- Trigger to automatically update project version
drop trigger if exists update_project_version_trigger on public.document_versions;
create trigger update_project_version_trigger
  after insert on public.document_versions
  for each row
  execute function public.update_project_version();

commit;