-- Row Level Security: every user can only see and modify their own rows.

alter table public.profiles                    enable row level security;
alter table public.journeys                    enable row level security;
alter table public.habits                      enable row level security;
alter table public.user_habits                 enable row level security;
alter table public.habit_logs                  enable row level security;
alter table public.daily_logs                  enable row level security;
alter table public.protein_logs                enable row level security;
alter table public.water_logs                  enable row level security;
alter table public.activity_logs               enable row level security;
alter table public.exercises                   enable row level security;
alter table public.workout_templates           enable row level security;
alter table public.workout_template_exercises  enable row level security;
alter table public.workout_sessions            enable row level security;
alter table public.workout_session_exercises   enable row level security;
alter table public.workout_sets                enable row level security;
alter table public.body_measurements           enable row level security;
alter table public.progress_photos             enable row level security;
alter table public.notification_preferences    enable row level security;

-- Owner-only policy for tables with a user_id column.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','journeys','user_habits','daily_logs','protein_logs','water_logs','activity_logs',
    'workout_templates','workout_sessions','body_measurements','progress_photos','notification_preferences'
  ] loop
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Child tables: owner-only, and the parent row must belong to the same user.
create policy "owner_all" on public.habit_logs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.user_habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );

create policy "owner_all" on public.workout_template_exercises for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = (select auth.uid()))
  );

create policy "owner_all" on public.workout_session_exercises for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
  );

create policy "owner_all" on public.workout_sets for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.workout_session_exercises e where e.id = session_exercise_id and e.user_id = (select auth.uid()))
  );

-- Catalogs: readable by signed-in users; global rows are managed via migrations/seed only.
create policy "read_catalog" on public.habits for select to authenticated using (true);
create policy "read_library_or_own" on public.exercises for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "manage_own_exercises" on public.exercises for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update_own_exercises" on public.exercises for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete_own_exercises" on public.exercises for delete to authenticated
  using (user_id = (select auth.uid()));
