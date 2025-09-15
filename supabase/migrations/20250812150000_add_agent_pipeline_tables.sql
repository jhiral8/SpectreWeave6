-- Agents and Pipelines persistence for SpectreWeave5

-- agent_templates: per-user agent definitions
create table if not exists public.agent_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  provider text,
  model text,
  temperature double precision default 0.7,
  max_tokens integer default 1000,
  prompt_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_templates_user_id_idx on public.agent_templates(user_id);

alter table public.agent_templates enable row level security;

drop policy if exists "agent_templates_select_own" on public.agent_templates;
create policy "agent_templates_select_own"
  on public.agent_templates for select
  using (user_id = auth.uid());

drop policy if exists "agent_templates_insert_own" on public.agent_templates;
create policy "agent_templates_insert_own"
  on public.agent_templates for insert
  with check (user_id = auth.uid());

drop policy if exists "agent_templates_update_own" on public.agent_templates;
create policy "agent_templates_update_own"
  on public.agent_templates for update
  using (user_id = auth.uid());

drop policy if exists "agent_templates_delete_own" on public.agent_templates;
create policy "agent_templates_delete_own"
  on public.agent_templates for delete
  using (user_id = auth.uid());

-- agent_pipelines: per-user pipeline definitions
create table if not exists public.agent_pipelines (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_pipelines_user_id_idx on public.agent_pipelines(user_id);
create unique index if not exists agent_pipelines_default_per_user on public.agent_pipelines(user_id) where is_default;

alter table public.agent_pipelines enable row level security;

drop policy if exists "agent_pipelines_select_own" on public.agent_pipelines;
create policy "agent_pipelines_select_own"
  on public.agent_pipelines for select
  using (user_id = auth.uid());

drop policy if exists "agent_pipelines_insert_own" on public.agent_pipelines;
create policy "agent_pipelines_insert_own"
  on public.agent_pipelines for insert
  with check (user_id = auth.uid());

drop policy if exists "agent_pipelines_update_own" on public.agent_pipelines;
create policy "agent_pipelines_update_own"
  on public.agent_pipelines for update
  using (user_id = auth.uid());

drop policy if exists "agent_pipelines_delete_own" on public.agent_pipelines;
create policy "agent_pipelines_delete_own"
  on public.agent_pipelines for delete
  using (user_id = auth.uid());

-- agent_pipeline_steps: ordered steps per pipeline
create table if not exists public.agent_pipeline_steps (
  id text primary key,
  pipeline_id text not null references public.agent_pipelines(id) on delete cascade,
  agent_id text references public.agent_templates(id) on delete set null,
  role text not null,
  enabled boolean not null default true,
  retrieval jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_pipeline_steps_pipeline_idx on public.agent_pipeline_steps(pipeline_id);
create index if not exists agent_pipeline_steps_order_idx on public.agent_pipeline_steps(pipeline_id, order_index);

alter table public.agent_pipeline_steps enable row level security;

drop policy if exists "agent_pipeline_steps_select_own" on public.agent_pipeline_steps;
create policy "agent_pipeline_steps_select_own"
  on public.agent_pipeline_steps for select
  using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_steps.pipeline_id
      and p.user_id = auth.uid()
  ));

drop policy if exists "agent_pipeline_steps_insert_own" on public.agent_pipeline_steps;
create policy "agent_pipeline_steps_insert_own"
  on public.agent_pipeline_steps for insert
  with check (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_steps.pipeline_id
      and p.user_id = auth.uid()
  ));

drop policy if exists "agent_pipeline_steps_update_own" on public.agent_pipeline_steps;
create policy "agent_pipeline_steps_update_own"
  on public.agent_pipeline_steps for update
  using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_steps.pipeline_id
      and p.user_id = auth.uid()
  ));

drop policy if exists "agent_pipeline_steps_delete_own" on public.agent_pipeline_steps;
create policy "agent_pipeline_steps_delete_own"
  on public.agent_pipeline_steps for delete
  using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_steps.pipeline_id
      and p.user_id = auth.uid()
  ));


