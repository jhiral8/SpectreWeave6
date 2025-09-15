-- DAG support for pipelines: links table and per-step input aggregation

-- 1) Add agent_pipeline_links to represent edges between steps
create table if not exists public.agent_pipeline_links (
  id text primary key,
  pipeline_id text not null references public.agent_pipelines(id) on delete cascade,
  from_step_id text not null references public.agent_pipeline_steps(id) on delete cascade,
  to_step_id text not null references public.agent_pipeline_steps(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agent_pipeline_links_pipeline_idx on public.agent_pipeline_links(pipeline_id);
create unique index if not exists agent_pipeline_links_unique_edge on public.agent_pipeline_links(pipeline_id, from_step_id, to_step_id);

alter table public.agent_pipeline_links enable row level security;

drop policy if exists "agent_pipeline_links_select_own" on public.agent_pipeline_links;
create policy "agent_pipeline_links_select_own"
  on public.agent_pipeline_links for select
  using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_links.pipeline_id
      and p.user_id = auth.uid()
  ));

drop policy if exists "agent_pipeline_links_insert_own" on public.agent_pipeline_links;
create policy "agent_pipeline_links_insert_own"
  on public.agent_pipeline_links for insert
  with check (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_links.pipeline_id
      and p.user_id = auth.uid()
  ));

drop policy if exists "agent_pipeline_links_delete_own" on public.agent_pipeline_links;
create policy "agent_pipeline_links_delete_own"
  on public.agent_pipeline_links for delete
  using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_links.pipeline_id
      and p.user_id = auth.uid()
  ));

-- 2) Add per-step input aggregation configuration
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'agent_pipeline_steps' and column_name = 'inputs_mode'
  ) then
    alter table public.agent_pipeline_steps add column inputs_mode text default 'concat';
  end if;
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'agent_pipeline_steps' and column_name = 'inputs_config'
  ) then
    alter table public.agent_pipeline_steps add column inputs_config jsonb;
  end if;
end $$;


