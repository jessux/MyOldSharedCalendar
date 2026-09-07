-- MyOldSharedCalendar - Supabase schema
-- Run this in the Supabase SQL editor.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_emoji text default '🙂',
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  timezone text not null default 'Europe/Paris',
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  color text not null default '#4f83cc',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.calendars (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade,
  name text not null default 'Famille',
  color text not null default '#4f83cc',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  calendar_id uuid references public.calendars(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text default 'famille' check (category in ('famille','ecole','travail','sante','loisirs','autre')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default true,
  recurrence_rule text,
  color_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_household_range_idx
  on public.events (household_id, starts_at, ends_at);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.calendars enable row level security;
alter table public.events enable row level security;

create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

create policy "households_member_select" on public.households
  for select using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = households.id and hm.user_id = auth.uid()
    )
  );
create policy "households_creator_insert" on public.households
  for insert with check (auth.uid() = created_by);
create policy "households_admin_update" on public.households
  for update using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = households.id
        and hm.user_id = auth.uid()
        and hm.role = 'admin'
    )
  );

create policy "members_select" on public.household_members
  for select using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
    )
  );
create policy "members_self_insert" on public.household_members
  for insert with check (auth.uid() = user_id);

create policy "calendars_member_select" on public.calendars
  for select using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = calendars.household_id and hm.user_id = auth.uid()
    )
  );
create policy "calendars_member_write" on public.calendars
  for all using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = calendars.household_id and hm.user_id = auth.uid()
    )
  );

create policy "events_member_select" on public.events
  for select using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = events.household_id and hm.user_id = auth.uid()
    )
  );
create policy "events_member_write" on public.events
  for all using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = events.household_id and hm.user_id = auth.uid()
    )
  );
