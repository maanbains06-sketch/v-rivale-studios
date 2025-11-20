-- Create table to track reapplication notification emails
CREATE TABLE public.whitelist_reapplication_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID NOT NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_notification UNIQUE (user_id, application_id)
);

-- Enable Row Level Security
ALTER TABLE public.whitelist_reapplication_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
ON public.whitelist_reapplication_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: System can insert notifications (we'll use service role in edge function)
CREATE POLICY "Service role can insert notifications"
ON public.whitelist_reapplication_notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_reapplication_notifications_user_id 
ON public.whitelist_reapplication_notifications(user_id);

CREATE INDEX idx_reapplication_notifications_application_id 
ON public.whitelist_reapplication_notifications(application_id);