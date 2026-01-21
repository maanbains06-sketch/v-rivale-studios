-- Create table to track cooldown expiry notifications
CREATE TABLE IF NOT EXISTS public.cooldown_expiry_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID NOT NULL,
  application_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for quick lookups
CREATE INDEX idx_cooldown_notifications_lookup ON public.cooldown_expiry_notifications(application_id, application_type);

-- Enable RLS
ALTER TABLE public.cooldown_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON public.cooldown_expiry_notifications FOR ALL USING (false);