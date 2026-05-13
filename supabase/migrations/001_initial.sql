-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text not null default 'Australia/Sydney',
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TASKS
-- ============================================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  due_time time,
  tags text[] default '{}',
  project_id uuid,
  is_recurring boolean not null default false,
  recurrence_pattern text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tasks_updated_at before update on tasks for each row execute function set_updated_at();
create index tasks_user_id_idx on tasks(user_id);
create index tasks_due_date_idx on tasks(due_date);

-- ============================================================
-- PROJECTS
-- ============================================================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  deadline date,
  client text,
  project_type text,
  color text not null default '#ef4444',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_updated_at before update on projects for each row execute function set_updated_at();
create index projects_user_id_idx on projects(user_id);

-- Add FK from tasks to projects
alter table tasks add constraint tasks_project_id_fkey foreign key (project_id) references projects(id) on delete set null;

-- ============================================================
-- PROJECT MILESTONES
-- ============================================================
create table project_milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_milestones_project_idx on project_milestones(project_id);

-- ============================================================
-- PROJECT LOGS
-- ============================================================
create table project_logs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  update text not null,
  blockers text,
  next_steps text,
  log_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index project_logs_project_idx on project_logs(project_id);

-- ============================================================
-- NOTES
-- ============================================================
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null default '',
  category text,
  tags text[] default '{}',
  is_pinned boolean not null default false,
  project_id uuid references projects on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger notes_updated_at before update on notes for each row execute function set_updated_at();
create index notes_user_id_idx on notes(user_id);

-- ============================================================
-- GYM LOGS
-- ============================================================
create table gym_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  workout_date date not null default current_date,
  workout_type text,
  duration_minutes integer,
  notes text,
  bodyweight numeric(5,2),
  created_at timestamptz not null default now()
);
create index gym_logs_user_id_idx on gym_logs(user_id);
create index gym_logs_date_idx on gym_logs(workout_date);

-- ============================================================
-- EXERCISES
-- ============================================================
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  gym_log_id uuid references gym_logs on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  sets integer not null default 1,
  reps integer,
  weight_kg numeric(6,2),
  is_pr boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index exercises_gym_log_idx on exercises(gym_log_id);

-- ============================================================
-- SKINCARE LOGS
-- ============================================================
create table skincare_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  log_date date not null default current_date,
  time_of_day text not null check (time_of_day in ('morning', 'night')),
  products_used text[] default '{}',
  skin_condition text,
  irritation_level integer check (irritation_level >= 1 and irritation_level <= 5),
  breakouts boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index skincare_logs_user_id_idx on skincare_logs(user_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  brand text,
  category text not null default 'other' check (category in ('skincare', 'gym', 'tech', 'supplements', 'grooming', 'food', 'software', 'other')),
  price numeric(10,2),
  purchase_date date,
  expiry_date date,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  status text not null default 'active' check (status in ('active', 'running_low', 'finished', 'discontinued')),
  rebuy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on products for each row execute function set_updated_at();
create index products_user_id_idx on products(user_id);

-- ============================================================
-- INCOME
-- ============================================================
create table income (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  source text not null,
  amount numeric(12,2) not null,
  frequency text not null default 'monthly' check (frequency in ('once', 'weekly', 'fortnightly', 'monthly', 'yearly')),
  received_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index income_user_id_idx on income(user_id);

-- ============================================================
-- EXPENSES
-- ============================================================
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount numeric(12,2) not null,
  category text not null default 'general',
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
create index expenses_user_id_idx on expenses(user_id);
create index expenses_date_idx on expenses(expense_date);

-- ============================================================
-- DEBTS
-- ============================================================
create table debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  total_amount numeric(12,2) not null,
  remaining_amount numeric(12,2) not null,
  interest_rate numeric(5,2),
  minimum_payment numeric(10,2),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger debts_updated_at before update on debts for each row execute function set_updated_at();

-- ============================================================
-- BILLS
-- ============================================================
create table bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric(10,2) not null,
  due_date date not null,
  frequency text not null default 'monthly' check (frequency in ('once', 'weekly', 'fortnightly', 'monthly', 'yearly')),
  category text not null default 'general',
  is_paid boolean not null default false,
  auto_pay boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index bills_user_id_idx on bills(user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric(10,2) not null,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('weekly', 'monthly', 'yearly')),
  next_billing_date date,
  category text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on subscriptions(user_id);

-- ============================================================
-- SAVINGS GOALS
-- ============================================================
create table savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger savings_goals_updated_at before update on savings_goals for each row execute function set_updated_at();

-- ============================================================
-- HABITS
-- ============================================================
create table habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  icon text,
  color text not null default '#ef4444',
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'custom')),
  target_days integer[] default '{0,1,2,3,4,5,6}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index habits_user_id_idx on habits(user_id);

-- ============================================================
-- HABIT LOGS
-- ============================================================
create table habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  log_date date not null default current_date,
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique(habit_id, log_date)
);
create index habit_logs_habit_idx on habit_logs(habit_id);
create index habit_logs_date_idx on habit_logs(log_date);

-- ============================================================
-- GOALS
-- ============================================================
create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  category text not null default 'personal' check (category in ('money', 'fitness', 'study', 'business', 'health', 'personal')),
  timeframe text not null default 'monthly' check (timeframe in ('daily', 'weekly', 'monthly', 'yearly')),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'abandoned')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger goals_updated_at before update on goals for each row execute function set_updated_at();
create index goals_user_id_idx on goals(user_id);

-- ============================================================
-- LEARNING PATHS
-- ============================================================
create table learning_paths (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  icon text,
  color text not null default '#ef4444',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger learning_paths_updated_at before update on learning_paths for each row execute function set_updated_at();

-- ============================================================
-- LEARNING TOPICS
-- ============================================================
create table learning_topics (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid references learning_paths on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'not_started' check (status in ('not_started', 'learning', 'completed', 'needs_revision')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  estimated_hours numeric(5,1),
  due_date date,
  completed_date date,
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger learning_topics_updated_at before update on learning_topics for each row execute function set_updated_at();
create index learning_topics_path_idx on learning_topics(path_id);

-- ============================================================
-- LEARNING RESOURCES
-- ============================================================
create table learning_resources (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references learning_topics on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  url text,
  type text not null default 'other' check (type in ('video', 'article', 'course', 'book', 'docs', 'other')),
  notes text,
  created_at timestamptz not null default now()
);
create index learning_resources_topic_idx on learning_resources(topic_id);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
create table study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  path_id uuid references learning_paths on delete set null,
  topic_id uuid references learning_topics on delete set null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  duration_minutes integer,
  notes text,
  created_at timestamptz not null default now()
);
create index study_sessions_user_idx on study_sessions(user_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================
create table certificates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  issuer text,
  path_id uuid references learning_paths on delete set null,
  issue_date date,
  expiry_date date,
  credential_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index certificates_user_idx on certificates(user_id);

-- ============================================================
-- HEALTH LOGS
-- ============================================================
create table health_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  log_date date not null default current_date,
  sleep_hours numeric(4,1),
  mood integer check (mood >= 1 and mood <= 10),
  energy integer check (energy >= 1 and energy <= 10),
  weight_kg numeric(5,2),
  water_ml integer,
  protein_g integer,
  calories integer,
  symptoms text,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);
create index health_logs_user_idx on health_logs(user_id);

-- ============================================================
-- REMINDERS
-- ============================================================
create table reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  reminder_type text not null default 'custom' check (reminder_type in ('bill', 'subscription', 'gym', 'skincare', 'deadline', 'study', 'product', 'custom')),
  due_date date not null,
  due_time time,
  is_recurring boolean not null default false,
  recurrence_pattern text,
  is_completed boolean not null default false,
  related_id uuid,
  related_type text,
  created_at timestamptz not null default now()
);
create index reminders_user_idx on reminders(user_id);
create index reminders_due_date_idx on reminders(due_date);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
create table calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  event_type text not null default 'personal' check (event_type in ('work_shift', 'study', 'gym', 'appointment', 'deadline', 'reminder', 'personal')),
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  all_day boolean not null default false,
  color text not null default '#ef4444',
  is_recurring boolean not null default false,
  recurrence_pattern text,
  created_at timestamptz not null default now()
);
create index calendar_events_user_idx on calendar_events(user_id);
create index calendar_events_date_idx on calendar_events(start_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table projects enable row level security;
alter table project_milestones enable row level security;
alter table project_logs enable row level security;
alter table notes enable row level security;
alter table gym_logs enable row level security;
alter table exercises enable row level security;
alter table skincare_logs enable row level security;
alter table products enable row level security;
alter table income enable row level security;
alter table expenses enable row level security;
alter table debts enable row level security;
alter table bills enable row level security;
alter table subscriptions enable row level security;
alter table savings_goals enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table goals enable row level security;
alter table learning_paths enable row level security;
alter table learning_topics enable row level security;
alter table learning_resources enable row level security;
alter table study_sessions enable row level security;
alter table certificates enable row level security;
alter table health_logs enable row level security;
alter table reminders enable row level security;
alter table calendar_events enable row level security;

-- Generic user-owns-row policy function
create or replace function create_user_policies(table_name text) returns void language plpgsql as $$
begin
  execute format('create policy "Users can view own %1$s" on %1$s for select using (auth.uid() = user_id)', table_name);
  execute format('create policy "Users can insert own %1$s" on %1$s for insert with check (auth.uid() = user_id)', table_name);
  execute format('create policy "Users can update own %1$s" on %1$s for update using (auth.uid() = user_id)', table_name);
  execute format('create policy "Users can delete own %1$s" on %1$s for delete using (auth.uid() = user_id)', table_name);
end;
$$;

-- profiles uses id (not user_id) as the owner column
create policy "Users can view own profiles" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profiles" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profiles" on profiles for update using (auth.uid() = id);
create policy "Users can delete own profiles" on profiles for delete using (auth.uid() = id);
select create_user_policies('tasks');
select create_user_policies('projects');
select create_user_policies('project_milestones');
select create_user_policies('project_logs');
select create_user_policies('notes');
select create_user_policies('gym_logs');
select create_user_policies('exercises');
select create_user_policies('skincare_logs');
select create_user_policies('products');
select create_user_policies('income');
select create_user_policies('expenses');
select create_user_policies('debts');
select create_user_policies('bills');
select create_user_policies('subscriptions');
select create_user_policies('savings_goals');
select create_user_policies('habits');
select create_user_policies('habit_logs');
select create_user_policies('goals');
select create_user_policies('learning_paths');
select create_user_policies('learning_topics');
select create_user_policies('learning_resources');
select create_user_policies('study_sessions');
select create_user_policies('certificates');
select create_user_policies('health_logs');
select create_user_policies('reminders');
select create_user_policies('calendar_events');
