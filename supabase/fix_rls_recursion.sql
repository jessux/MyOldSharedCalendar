-- Correctif : recursion infinie dans les policies RLS de household_members
-- A executer dans l'editeur SQL Supabase si le schema initial a deja ete applique.

-- 1. Fonction utilitaire qui contourne le RLS pour eviter la recursion
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

-- 2. Suppression des anciennes policies recursives / dependantes
drop policy if exists "members_select" on public.household_members;
drop policy if exists "households_member_select" on public.households;
drop policy if exists "households_admin_update" on public.households;
drop policy if exists "calendars_member_select" on public.calendars;
drop policy if exists "calendars_member_write" on public.calendars;
drop policy if exists "events_member_select" on public.events;
drop policy if exists "events_member_write" on public.events;

-- 3. Recreation des policies en utilisant les fonctions (plus de recursion)
create policy "members_select" on public.household_members
  for select using (public.is_household_member(household_id));

create policy "households_member_select" on public.households
  for select using (public.is_household_member(id));

create policy "households_admin_update" on public.households
  for update using (public.is_household_admin(id));

create policy "calendars_member_select" on public.calendars
  for select using (public.is_household_member(household_id));

create policy "calendars_member_write" on public.calendars
  for all using (public.is_household_member(household_id));

create policy "events_member_select" on public.events
  for select using (public.is_household_member(household_id));

create policy "events_member_write" on public.events
  for all using (public.is_household_member(household_id));
