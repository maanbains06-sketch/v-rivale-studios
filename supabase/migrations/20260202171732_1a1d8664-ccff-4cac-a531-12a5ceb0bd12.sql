-- Add DELETE policies for support_chats (owner only)
CREATE POLICY "Owner can delete chats" 
ON public.support_chats 
FOR DELETE 
USING (is_owner(auth.uid()));

-- Add DELETE policies for support_messages (owner only)
CREATE POLICY "Owner can delete messages" 
ON public.support_messages 
FOR DELETE 
USING (is_owner(auth.uid()));

-- Add DELETE policies for support_chat_ratings (owner only)
CREATE POLICY "Owner can delete chat ratings" 
ON public.support_chat_ratings 
FOR DELETE 
USING (is_owner(auth.uid()));

-- Add DELETE policies for ai_message_ratings (owner only)
CREATE POLICY "Owner can delete ai ratings" 
ON public.ai_message_ratings 
FOR DELETE 
USING (is_owner(auth.uid()));