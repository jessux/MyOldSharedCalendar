-- MyOldSharedCalendar - Supabase schema (version corrigee, sans recursion RLS ni probleme chicken-egg)
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

-- Sans ces GRANT, Postgres bloque les requetes du role "authenticated"
-- avant meme d'evaluer les policies RLS ci-dessous (erreur 42501:
-- "permission denied for table ..."). Les policies restent la seule
-- barriere reelle par ligne, ce GRANT ouvre juste la porte d'entree.
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.calendars enable row level security;
alter table public.events enable row level security;

-- Fonctions SECURITY DEFINER : evitent toute recursion RLS sur household_members
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_admin(hid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated, anon;
revoke all on function public.is_household_admin(uuid) from public;
grant execute on function public.is_household_admin(uuid) to authenticated, anon;

-- Profiles
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- Households
-- Note : le createur voit son foyer meme avant d'etre insere dans household_members
-- (necessaire pour que insert(...).select() fonctionne juste apres la creation)
create policy "households_member_select" on public.households
  for select using (
    public.is_household_member(id) or auth.uid() = created_by
  );
create policy "households_creator_insert" on public.households
  for insert with check (auth.uid() = created_by);
create policy "households_admin_update" on public.households
  for update using (public.is_household_admin(id));

-- Household members (utilise la fonction, jamais de sous-requete directe sur elle-meme)
create policy "members_select" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "members_self_insert" on public.household_members
  for insert with check (auth.uid() = user_id);

-- Calendars
create policy "calendars_member_select" on public.calendars
  for select using (public.is_household_member(household_id));
create policy "calendars_member_write" on public.calendars
  for all using (public.is_household_member(household_id));

-- Events
create policy "events_member_select" on public.events
  for select using (public.is_household_member(household_id));
create policy "events_member_write" on public.events
  for all using (public.is_household_member(household_id));

-- Rejoindre un foyer via code d'invitation (ecran "Rejoindre un foyer" / partage familial).
-- SECURITY DEFINER : le contournement de RLS est necessaire pour lire households
-- par invite_code avant que l'appelant ne soit membre, puis s'auto-inserer dans
-- household_members.
create or replace function public.join_household_by_invite_code(p_invite_code text, p_color text default '#4f83cc')
returns table (household_id uuid, household_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_household_name text;
begin
  select id, name into v_household_id, v_household_name
  from public.households
  where lower(invite_code) = lower(p_invite_code);

  if v_household_id is null then
    raise exception 'invite_code_not_found' using errcode = 'P0002';
  end if;

  insert into public.household_members (household_id, user_id, role, color)
  values (v_household_id, auth.uid(), 'member', coalesce(p_color, '#4f83cc'))
  on conflict (household_id, user_id) do nothing;

  return query select v_household_id, v_household_name;
end;
$$;

revoke all on function public.join_household_by_invite_code(text, text) from public;
grant execute on function public.join_household_by_invite_code(text, text) to authenticated, anon;
