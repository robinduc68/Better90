-- Level90 — initial schema
-- Conventions:
--   * Client-generated UUID primary keys (offline-first, idempotent upserts).
--   * Every user-owned row carries user_id for simple, fast RLS.
--   * Dates are local calendar dates (date); instants are timestamptz.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  height_cm    numeric(5,1) check (height_cm between 80 and 250),
  unit_system  text not null default 'metric' check (unit_system in ('metric')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Journeys
-- ---------------------------------------------------------------------------
create table public.journeys (
  id                 uuid primary key,
  user_id            uuid not null references auth.users (id) on delete cascade,
  start_date         date not null,
  duration_days      smallint not null check (duration_days in (30, 60, 90)),
  goals              text[] not null default '{}'
                     check (goals <@ array['build_muscle','lose_fat','recomposition','appearance','discipline','custom']::text[]),
  custom_goal        text check (char_length(custom_goal) <= 80),
  protein_target_g   integer not null check (protein_target_g between 0 and 400),
  water_target_ml    integer not null check (water_target_ml between 0 and 8000),
  sleep_target_min   integer not null check (sleep_target_min between 0 and 960),
  gym_days_per_week  smallint not null check (gym_days_per_week between 0 and 7),
  activities         text[] not null default '{}'
                     check (activities <@ array['football','running','cycling','other']::text[]),
  status             text not null default 'active' check (status in ('active','completed','ended')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index journeys_user_idx on public.journeys (user_id, start_date desc);
create unique index journeys_one_active_per_user on public.journeys (user_id) where status = 'active';

-- Goals are a small fixed set stored on the journey (text[] + check) rather than a join table.
-- A journey_goals view keeps the normalized shape available for analytics/reporting.
create view public.journey_goals with (security_invoker = true) as
  select j.id as journey_id, j.user_id, g.goal, case when g.goal = 'custom' then j.custom_goal end as custom_label
  from public.journeys j, unnest(j.goals) as g(goal);

-- ---------------------------------------------------------------------------
-- Habits
-- ---------------------------------------------------------------------------
-- Catalog of predefined habits (read-only for clients).
create table public.habits (
  key            text primary key,
  name           text not null,
  kind           text not null check (kind in ('boolean','duration','count')),
  default_target numeric,
  unit           text,
  category       text not null,
  time_of_day    text not null check (time_of_day in ('morning','evening','anytime')),
  default_steps  text[] not null default '{}'
);

create table public.user_habits (
  id                   uuid primary key,
  user_id              uuid not null references auth.users (id) on delete cascade,
  template_key         text references public.habits (key) on delete set null,
  name                 text not null check (char_length(name) between 1 and 60),
  kind                 text not null check (kind in ('boolean','duration','count')),
  target               numeric check (target is null or target > 0),
  unit                 text,
  category             text not null check (category in ('skincare','learning','reading','movement','mind','custom')),
  time_of_day          text not null default 'anytime' check (time_of_day in ('morning','evening','anytime')),
  routine_steps        jsonb not null default '[]'::jsonb check (jsonb_typeof(routine_steps) = 'array'),
  routine_tags         jsonb not null default '[]'::jsonb check (jsonb_typeof(routine_tags) = 'array'),
  counts_toward_score  boolean not null default true,
  sort_order           integer not null default 0,
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (kind = 'boolean' or target is not null)
);
create index user_habits_user_idx on public.user_habits (user_id, sort_order);

create table public.habit_logs (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  habit_id    uuid not null references public.user_habits (id) on delete cascade,
  date        date not null,
  value       numeric not null default 0 check (value >= 0),
  steps_done  text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  unique (habit_id, date)
);
create index habit_logs_user_date_idx on public.habit_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- Daily logs, nutrition, activities
-- ---------------------------------------------------------------------------
create table public.daily_logs (
  id             uuid primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  date           date not null,
  sleep_minutes  integer check (sleep_minutes between 0 and 1440),
  note           text check (char_length(note) <= 500),
  updated_at     timestamptz not null default now(),
  unique (user_id, date)
);

create table public.protein_logs (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  grams      numeric(5,1) not null check (grams > 0 and grams <= 300),
  logged_at  timestamptz not null default now()
);
create index protein_logs_user_date_idx on public.protein_logs (user_id, date);

create table public.water_logs (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  ml         integer not null check (ml > 0 and ml <= 3000),
  logged_at  timestamptz not null default now()
);
create index water_logs_user_date_idx on public.water_logs (user_id, date);

create table public.activity_logs (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  activity   text not null check (activity in ('football','running','cycling','other')),
  minutes    integer not null check (minutes between 1 and 600),
  logged_at  timestamptz not null default now()
);
create index activity_logs_user_date_idx on public.activity_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- Exercises & workouts
-- ---------------------------------------------------------------------------
create table public.exercises (
  id                 text primary key,
  -- null = global library exercise; set = user's custom exercise (future)
  user_id            uuid references auth.users (id) on delete cascade,
  name               text not null,
  muscle_group       text not null check (muscle_group in ('chest','back','shoulders','biceps','triceps','legs','abs','glutes','calves','full_body')),
  secondary_muscles  text[] not null default '{}',
  equipment          text not null check (equipment in ('barbell','dumbbell','cable','machine','bodyweight','other')),
  instructions       text[] not null default '{}',
  image_url          text,
  animation_url      text,
  is_bodyweight      boolean not null default false,
  created_at         timestamptz not null default now()
);
create index exercises_muscle_idx on public.exercises (muscle_group);

create table public.workout_templates (
  id           uuid primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  weekdays     smallint[] not null default '{}' check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index workout_templates_user_idx on public.workout_templates (user_id);

create table public.workout_template_exercises (
  id            uuid primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  template_id   uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id   text not null references public.exercises (id),
  position      smallint not null check (position >= 0),
  target_sets   smallint not null check (target_sets between 1 and 20),
  target_reps   smallint not null check (target_reps between 1 and 100),
  rest_seconds  smallint check (rest_seconds between 0 and 900)
);
create index workout_template_exercises_template_idx on public.workout_template_exercises (template_id, position);

create table public.workout_sessions (
  id           uuid primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  template_id  uuid references public.workout_templates (id) on delete set null,
  name         text not null,
  date         date not null,
  started_at   timestamptz not null,
  ended_at     timestamptz,
  status       text not null check (status in ('active','completed')),
  updated_at   timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index workout_sessions_user_date_idx on public.workout_sessions (user_id, date desc);

create table public.workout_session_exercises (
  id            uuid primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  session_id    uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id   text not null references public.exercises (id),
  position      smallint not null check (position >= 0),
  target_sets   smallint not null check (target_sets between 1 and 20),
  target_reps   smallint check (target_reps between 1 and 100),
  completed_at  timestamptz
);
create index workout_session_exercises_session_idx on public.workout_session_exercises (session_id, position);
create index workout_session_exercises_exercise_idx on public.workout_session_exercises (user_id, exercise_id);

create table public.workout_sets (
  id                   uuid primary key,
  user_id              uuid not null references auth.users (id) on delete cascade,
  session_exercise_id  uuid not null references public.workout_session_exercises (id) on delete cascade,
  position             smallint not null check (position >= 0),
  weight_kg            numeric(6,2) check (weight_kg between 0 and 1000),
  reps                 smallint check (reps between 0 and 1000),
  completed_at         timestamptz
);
create index workout_sets_exercise_idx on public.workout_sets (session_exercise_id, position);

-- ---------------------------------------------------------------------------
-- Body progress
-- ---------------------------------------------------------------------------
create table public.body_measurements (
  id            uuid primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null,
  weight_kg     numeric(5,2) check (weight_kg between 20 and 400),
  waist_cm      numeric(5,1) check (waist_cm between 30 and 250),
  chest_cm      numeric(5,1) check (chest_cm between 40 and 250),
  left_arm_cm   numeric(4,1) check (left_arm_cm between 10 and 80),
  right_arm_cm  numeric(4,1) check (right_arm_cm between 10 and 80),
  body_fat_pct  numeric(4,1) check (body_fat_pct between 2 and 70),
  updated_at    timestamptz not null default now(),
  unique (user_id, date)
);

create table public.progress_photos (
  id            uuid primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null,
  day_number    smallint not null check (day_number between 1 and 90),
  pose          text not null check (pose in ('front','side','back')),
  -- Object path inside the private "progress-photos" bucket: "<user_id>/<photo_id>.jpg"
  storage_path  text not null,
  created_at    timestamptz not null default now(),
  check (storage_path like user_id::text || '/%')
);
create index progress_photos_user_day_idx on public.progress_photos (user_id, day_number);

-- ---------------------------------------------------------------------------
-- Notification preferences (1:1 with user)
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  water_enabled     boolean not null default true,
  water_start_min   smallint not null default 540 check (water_start_min between 0 and 1439),
  water_end_min     smallint not null default 1200 check (water_end_min between 0 and 1439),
  water_per_day     smallint not null default 3 check (water_per_day between 0 and 8),
  workout_enabled   boolean not null default true,
  workout_time_min  smallint not null default 480 check (workout_time_min between 0 and 1439),
  habit_enabled     boolean not null default true,
  habit_time_min    smallint not null default 1260 check (habit_time_min between 0 and 1439),
  journey_enabled   boolean not null default true,
  journey_time_min  smallint not null default 450 check (journey_time_min between 0 and 1439),
  rest_enabled      boolean not null default true,
  updated_at        timestamptz not null default now(),
  check (water_end_min > water_start_min)
);
