-- Fix promo_codes RLS to allow admins to create and view all codes
DROP POLICY IF EXISTS "System can insert promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "System can update promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users can only view own promo codes or ones they used" ON public.promo_codes;
DROP POLICY IF EXISTS "Users can view own promo codes" ON public.promo_codes;

-- Create proper policies for promo codes
CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'moderator')
  )
  OR
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE staff_members.user_id = auth.uid() 
    AND staff_members.role_type IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can view codes assigned to them" 
ON public.promo_codes 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = used_by);

-- Fix giveaways RLS to include owner check via staff_members
DROP POLICY IF EXISTS "Admins can manage giveaways" ON public.giveaways;

CREATE POLICY "Admins and owner can manage giveaways" 
ON public.giveaways 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'moderator')
  )
  OR
  EXISTS (
    SELECT 1 FROM staff_members 
    WHERE staff_members.user_id = auth.uid() 
    AND staff_members.role_type IN ('owner', 'admin')
  )
);