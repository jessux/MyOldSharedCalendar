-- Fonction manquante utilisee par l'ecran "Rejoindre un foyer" (HouseholdOnboarding.tsx).
-- Sans elle, rejoindre un foyer echoue toujours (fonction introuvable cote PostgREST).
-- A executer dans l'editeur SQL Supabase.

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
