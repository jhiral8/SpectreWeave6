-- Add separate manuscript/framework content columns to projects and documents
-- Safe to run multiple times thanks to IF NOT EXISTS

begin;

-- Projects table
alter table if exists public.projects
  add column if not exists manuscript_content jsonb,
  add column if not exists framework_content jsonb,
  add column if not exists manuscript_updated_at timestamptz,
  add column if not exists framework_updated_at timestamptz;

-- Documents table
alter table if exists public.documents
  add column if not exists manuscript_content jsonb,
  add column if not exists framework_content jsonb,
  add column if not exists manuscript_updated_at timestamptz,
  add column if not exists framework_updated_at timestamptz;

commit;

-- Backfill is intentionally omitted to avoid casting errors on arbitrary text content.
-- Application code will fall back to the legacy "content" field and rewrite these columns on next save.


