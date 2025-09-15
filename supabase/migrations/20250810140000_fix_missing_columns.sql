-- Add missing columns to document_versions table
begin;

-- Add missing columns that may not have been created properly
alter table public.document_versions 
  add column if not exists content jsonb,
  add column if not exists summary text,
  add column if not exists word_count integer default 0,
  add column if not exists created_by uuid,
  add column if not exists is_milestone boolean default false,
  add column if not exists tags text[];

-- Add missing constraints using DO block to handle "if not exists"
do $$
begin
  -- Add version number constraint if it doesn't exist
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'document_versions_version_number_positive' 
    and table_name = 'document_versions'
  ) then
    alter table public.document_versions 
      add constraint document_versions_version_number_positive 
      check (version_number > 0);
  end if;

  -- Add word count constraint if it doesn't exist
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'document_versions_word_count_positive' 
    and table_name = 'document_versions'
  ) then
    alter table public.document_versions 
      add constraint document_versions_word_count_positive 
      check (word_count >= 0);
  end if;
end $$;

commit;