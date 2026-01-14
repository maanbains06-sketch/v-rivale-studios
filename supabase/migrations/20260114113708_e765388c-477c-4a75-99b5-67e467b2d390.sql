-- Drop the problematic policy that references its own table in subquery
DROP POLICY IF EXISTS "Users can insert own messages" ON public.support_messages;

-- Create a proper INSERT policy that just checks user_id and is_staff
CREATE POLICY "Users can insert own messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND is_staff = false
  AND EXISTS (
    SELECT 1 FROM public.support_chats 
    WHERE support_chats.id = chat_id 
    AND support_chats.user_id = auth.uid()
  )
);