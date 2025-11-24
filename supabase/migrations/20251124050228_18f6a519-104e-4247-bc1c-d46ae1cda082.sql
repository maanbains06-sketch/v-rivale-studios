-- Create support_messages table for live chat
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_chats table to organize conversations
CREATE TABLE public.support_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_messages
CREATE POLICY "Users can view own chat messages"
ON public.support_messages
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM support_chats WHERE id = chat_id
  ) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users can insert own messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_staff = false);

CREATE POLICY "Staff can insert messages"
ON public.support_messages
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  AND is_staff = true
);

CREATE POLICY "Staff can update messages"
ON public.support_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- RLS Policies for support_chats
CREATE POLICY "Users can view own chats"
ON public.support_chats
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users can create own chats"
ON public.support_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update chats"
ON public.support_chats
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to create notification on status change
CREATE OR REPLACE FUNCTION create_status_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification if status changed
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN TG_TABLE_NAME = 'ban_appeals' THEN 'Ban Appeal ' || NEW.status
        WHEN TG_TABLE_NAME = 'gallery_submissions' THEN 'Gallery Submission ' || NEW.status
        WHEN TG_TABLE_NAME = 'job_applications' THEN 'Job Application ' || NEW.status
        WHEN TG_TABLE_NAME = 'whitelist_applications' THEN 'Whitelist Application ' || NEW.status
        WHEN TG_TABLE_NAME = 'staff_applications' THEN 'Staff Application ' || NEW.status
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your application has been approved! Check your dashboard for details.'
        WHEN NEW.status = 'rejected' THEN 'Your application has been reviewed. Please check your dashboard for feedback.'
        ELSE 'Your application status has been updated to: ' || NEW.status
      END,
      TG_TABLE_NAME,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for status notifications
CREATE TRIGGER ban_appeals_status_notification
AFTER UPDATE ON ban_appeals
FOR EACH ROW
EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER gallery_submissions_status_notification
AFTER UPDATE ON gallery_submissions
FOR EACH ROW
EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER job_applications_status_notification
AFTER UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER whitelist_applications_status_notification
AFTER UPDATE ON whitelist_applications
FOR EACH ROW
EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER staff_applications_status_notification
AFTER UPDATE ON staff_applications
FOR EACH ROW
EXECUTE FUNCTION create_status_notification();

-- Create trigger to update updated_at
CREATE TRIGGER update_support_messages_updated_at
BEFORE UPDATE ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_chats_updated_at
BEFORE UPDATE ON support_chats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX support_messages_chat_id_idx ON support_messages(chat_id);
CREATE INDEX support_messages_user_id_idx ON support_messages(user_id);
CREATE INDEX support_chats_user_id_idx ON support_chats(user_id);
CREATE INDEX support_chats_status_idx ON support_chats(status);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(read);

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;