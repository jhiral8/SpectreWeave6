-- Temporarily disable RLS completely for debugging
begin;

-- Disable RLS on document_versions
alter table public.document_versions disable row level security;

commit;