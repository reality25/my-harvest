-- ============================================================
-- Harvest: Extended Farm Schema  (idempotent)
-- Run AFTER farm_schema.sql
-- Adds: farm_tasks table (manual + AI-generated to-dos)
-- ============================================================


-- ─── farm_tasks ───────────────────────────────────────────
-- Discrete to-do items tied to a farm record (distinct from
-- farm_activities, which are scheduled field operations).

create table if not exists public.farm_tasks (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        references public.profiles(id) on delete cascade not null,
  farm_record_id    uuid        references public.farm_records(id) on delete set null,

  title             text        not null,
  description       text,
  category          text        not null default 'other'
                      check (category in (
                        'irrigation','fertilization','pesticide','harvesting',
                        'health','monitoring','labor','planning','other')),

  task_type         text        not null default 'manual'
                      check (task_type in ('manual','ai_generated','system')),

  priority          text        not null default 'medium'
                      check (priority in ('low','medium','high','urgent')),

  due_date          date,
  is_completed      boolean     not null default false,
  completed_at      timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.farm_tasks enable row level security;

drop policy if exists "Users read own tasks"   on public.farm_tasks;
drop policy if exists "Users create tasks"     on public.farm_tasks;
drop policy if exists "Users update own tasks" on public.farm_tasks;
drop policy if exists "Users delete own tasks" on public.farm_tasks;

create policy "Users read own tasks"
  on public.farm_tasks for select using (auth.uid() = user_id);
create policy "Users create tasks"
  on public.farm_tasks for insert with check (auth.uid() = user_id);
create policy "Users update own tasks"
  on public.farm_tasks for update using (auth.uid() = user_id);
create policy "Users delete own tasks"
  on public.farm_tasks for delete using (auth.uid() = user_id);

create index if not exists idx_farm_tasks_user_id
  on public.farm_tasks (user_id);
create index if not exists idx_farm_tasks_record_id
  on public.farm_tasks (farm_record_id)
  where farm_record_id is not null;
create index if not exists idx_farm_tasks_due_date
  on public.farm_tasks (user_id, due_date)
  where is_completed = false;
create index if not exists idx_farm_tasks_priority
  on public.farm_tasks (user_id, priority)
  where is_completed = false;

-- updated_at trigger for farm_tasks
drop trigger if exists trg_farm_tasks_updated_at on public.farm_tasks;
create trigger trg_farm_tasks_updated_at
  before update on public.farm_tasks
  for each row execute function public.set_updated_at();


-- ─── ai_scans view (convenience) ──────────────────────────
-- A view over ai_requests for image diagnosis scans only.
-- Applications can query this instead of filtering ai_requests.

create or replace view public.ai_scans as
  select
    id,
    user_id,
    session_id,
    mode,
    text_query,
    image_url,
    related_farm_record_id,
    status,
    response_text,
    ai_model,
    confidence_score,
    tags,
    created_at,
    updated_at
  from public.ai_requests
  where request_type = 'image_diagnosis';
