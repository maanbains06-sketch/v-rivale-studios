-- Re-grant SELECT on discord_presence_public to anon users
-- This view already excludes the discord_id field, so it's safe for public access
-- It only shows: id, staff_member_id, is_online, status, last_online_at, updated_at
GRANT SELECT ON public.discord_presence_public TO anon;
GRANT SELECT ON public.discord_presence_public TO authenticated;

-- Also ensure staff_members_public is accessible
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;