-- Add version column to projects table (simple approach)
alter table public.projects add column if not exists version text default 'v0.1.0';