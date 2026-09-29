-- Nutrition: meals with optional items and photos. Additive only.
-- Daily totals = sum(meals) + sum(protein_logs); both remain valid sources.

alter table public.journeys
  add column calorie_target_kcal integer check (calorie_target_kcal between 0 and 10000),
  add column carbs_target_g integer check (carbs_target_g between 0 and 1500),
  add column fat_target_g integer check (fat_target_g between 0 and 500);

create table public.meals (
  id                   uuid primary key,
  user_id              uuid not null references auth.users (id) on delete cascade,
  date                 date not null,
  meal_type            text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  name                 text not null check (char_length(name) between 1 and 80),
  logged_at            timestamptz not null default now(),
  calories             integer check (calories between 0 and 10000),
  protein_g            numeric(6,1) check (protein_g between 0 and 1000),
  carbs_g              numeric(6,1) check (carbs_g between 0 and 1500),
  fat_g                numeric(6,1) check (fat_g between 0 and 500),
  -- Object path inside the private "meal-photos" bucket: "<user_id>/<meal_id>.jpg"
  photo_storage_path   text check (photo_storage_path is null or photo_storage_path like user_id::text || '/%'),
  source               text not null default 'manual' check (source in ('manual','photo_estimate')),
  estimate_confidence  numeric(3,2) check (estimate_confidence between 0 and 1),
  updated_at           timestamptz not null default now()
);
create index meals_user_date_idx on public.meals (user_id, date);

create table public.meal_items (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  meal_id    uuid not null references public.meals (id) on delete cascade,
  position   smallint not null check (position >= 0),
  name       text not null check (char_length(name) between 1 and 80),
  amount     text check (char_length(amount) <= 40),
  calories   integer check (calories between 0 and 10000),
  protein_g  numeric(6,1) check (protein_g between 0 and 1000),
  carbs_g    numeric(6,1) check (carbs_g between 0 and 1500),
  fat_g      numeric(6,1) check (fat_g between 0 and 500)
);
create index meal_items_meal_idx on public.meal_items (meal_id, position);

alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

create policy "owner_all" on public.meals for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "owner_all" on public.meal_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
  );

-- Private bucket for meal photos (personal data). Signed URLs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = false;

create policy "meal_photos_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "meal_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "meal_photos_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "meal_photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
