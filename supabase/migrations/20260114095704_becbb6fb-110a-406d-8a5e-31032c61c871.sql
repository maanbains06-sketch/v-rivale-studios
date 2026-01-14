-- Fix ambiguous user_id column reference in support_chats RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own chats" ON public.support_chats;
DROP POLICY IF EXISTS "Users can view own chats" ON public.support_chats;
DROP POLICY IF EXISTS "Users and staff can update chats" ON public.support_chats;

-- Recreate with table-qualified column references
CREATE POLICY "Users can create own chats" 
ON public.support_chats 
FOR INSERT 
WITH CHECK (auth.uid() = support_chats.user_id);

CREATE POLICY "Users can view own chats" 
ON public.support_chats 
FOR SELECT 
USING (
  (auth.uid() = support_chats.user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users and staff can update chats" 
ON public.support_chats 
FOR UPDATE 
USING (
  (auth.uid() = support_chats.user_id) OR 
  (auth.uid() = support_chats.assigned_to) OR 
  is_owner(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);