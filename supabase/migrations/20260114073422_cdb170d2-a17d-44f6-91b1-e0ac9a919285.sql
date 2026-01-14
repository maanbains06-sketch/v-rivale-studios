-- Ensure owner_discord_id setting exists and is set
insert into public.site_settings (key, value, description)
values ('owner_discord_id', '833680146510381097', 'Discord ID that has exclusive Owner Panel access')
on conflict (key)
do update set value = excluded.value, updated_at = now();

-- Make is_owner check the user''s stored discord_id (from auth metadata) first,
-- then fall back to staff_members.user_id mapping.
create or replace function public.is_owner(_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  owner_discord text;
  user_discord text;
begin
  select value into owner_discord
  from public.site_settings
  where key = 'owner_discord_id';

  -- Primary: read discord_id stored on the authenticated user record
  select (u.raw_user_meta_data->>'discord_id') into user_discord
  from auth.users u
  where u.id = _user_id;

  -- Fallback: legacy mapping via staff_members.user_id
  if user_discord is null then
    select sm.discord_id into user_discord
    from public.staff_members sm
    where sm.user_id = _user_id and sm.is_active = true
    limit 1;
  end if;

  return owner_discord is not null
     and owner_discord <> ''
     and user_discord is not null
     and owner_discord = user_discord;
end;
$$;