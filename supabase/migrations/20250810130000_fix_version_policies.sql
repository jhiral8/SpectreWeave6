-- Fix RLS policies for document_versions table
begin;

-- Drop existing policies
drop policy if exists "Users can view versions of their projects" on public.document_versions;
drop policy if exists "Users can create versions for their projects" on public.document_versions;

-- Temporarily disable RLS to test
alter table public.document_versions disable row level security;

-- Create simpler policies that don't depend on complex joins
create policy "Enable read access for authenticated users" on public.document_versions
  for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on public.document_versions
  for insert with check (auth.role() = 'authenticated');

-- Re-enable RLS
alter table public.document_versions enable row level security;

commit;