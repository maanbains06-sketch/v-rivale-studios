-- Create direct messages table for 1-on-1 chat between users and staff
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  staff_member_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_staff_member ON public.direct_messages(staff_member_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON public.direct_messages
  FOR SELECT
  USING (
    auth.uid() = direct_messages.sender_id 
    OR auth.uid() = direct_messages.receiver_id
  );

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.direct_messages
  FOR INSERT
  WITH CHECK (auth.uid() = direct_messages.sender_id);

-- Users can update their own sent messages (mark as read)
CREATE POLICY "Users can update received messages" ON public.direct_messages
  FOR UPDATE
  USING (auth.uid() = direct_messages.receiver_id);

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Create conversations view for easier querying
CREATE OR REPLACE VIEW public.user_conversations AS
SELECT DISTINCT ON (conversation_partner)
  CASE 
    WHEN dm.sender_id = auth.uid() THEN dm.receiver_id
    ELSE dm.sender_id
  END as conversation_partner,
  dm.staff_member_id,
  dm.message as last_message,
  dm.created_at as last_message_at,
  dm.read,
  (SELECT COUNT(*) FROM public.direct_messages 
   WHERE receiver_id = auth.uid() 
   AND sender_id = CASE WHEN dm.sender_id = auth.uid() THEN dm.receiver_id ELSE dm.sender_id END
   AND read = false) as unread_count
FROM public.direct_messages dm
WHERE dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid()
ORDER BY conversation_partner, dm.created_at DESC;