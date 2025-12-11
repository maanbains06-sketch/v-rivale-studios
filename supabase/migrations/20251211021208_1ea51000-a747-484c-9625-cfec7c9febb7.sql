-- Allow anyone to view the staff_members_public view (it already excludes sensitive fields like email, discord_id, steam_id)
CREATE POLICY "Anyone can view public staff info" 
ON public.staff_members 
FOR SELECT 
USING (is_active = true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view active staff" ON public.staff_members;