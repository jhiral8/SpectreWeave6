-- Add missing content_snapshot column to document_versions table
begin;

-- Add content_snapshot column (required field)
alter table public.document_versions 
  add column if not exists content_snapshot jsonb not null default '{}'::jsonb;

commit;