-- Add RLS policy to allow authenticated users to update their own presence via edge function
-- The service role handles this, but we need a policy for direct updates

-- Create a policy that allows updates when the staff_member's user_id matches auth.uid()
CREATE POLICY "Staff can update own presence" 
ON public.discord_presence 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE staff_members.id = discord_presence.staff_member_id 
    AND staff_members.user_id = auth.uid()
  )
);

-- Also allow insert for staff
CREATE POLICY "Staff can insert own presence" 
ON public.discord_presence 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE staff_members.id = discord_presence.staff_member_id 
    AND staff_members.user_id = auth.uid()
  )
);