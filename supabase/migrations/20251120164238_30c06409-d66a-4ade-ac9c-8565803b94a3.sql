-- Drop the overly permissive policy that allows anyone to view all roles
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

-- Create a policy allowing users to view only their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a policy allowing admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));