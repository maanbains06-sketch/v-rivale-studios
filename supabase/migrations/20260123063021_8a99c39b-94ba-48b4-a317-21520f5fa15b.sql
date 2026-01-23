-- Drop the existing policy
DROP POLICY IF EXISTS "Admins and owner can manage giveaways" ON public.giveaways;

-- Create a new policy with proper WITH CHECK clause
CREATE POLICY "Admins and owner can manage giveaways" 
ON public.giveaways 
FOR ALL 
USING (
  (EXISTS ( 
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'moderator'::app_role])
  )) 
  OR 
  (EXISTS ( 
    SELECT 1 FROM staff_members 
    WHERE staff_members.user_id = auth.uid() 
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
)
WITH CHECK (
  (EXISTS ( 
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'moderator'::app_role])
  )) 
  OR 
  (EXISTS ( 
    SELECT 1 FROM staff_members 
    WHERE staff_members.user_id = auth.uid() 
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
);