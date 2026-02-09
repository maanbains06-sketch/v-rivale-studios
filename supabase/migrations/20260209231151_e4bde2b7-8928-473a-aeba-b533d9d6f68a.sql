
-- Fix support_chats SELECT policy to include owner
DROP POLICY IF EXISTS "Users can view own chats" ON public.support_chats;
CREATE POLICY "Users can view own chats" ON public.support_chats
FOR SELECT USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_owner(auth.uid())
);
