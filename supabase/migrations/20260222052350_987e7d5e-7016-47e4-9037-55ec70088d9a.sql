
-- Security events table for tracking login attempts, blocked IPs, suspicious activity
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'failed_login', 'blocked_ip', 'suspicious_activity', 'bot_detected', 'lockdown_activated', 'lockdown_deactivated'
  ip_address TEXT,
  user_id UUID,
  discord_id TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only owner can view security events
CREATE POLICY "Owner can view security events"
  ON public.security_events FOR SELECT
  USING (public.is_owner(auth.uid()));

-- Allow insert from anyone (for logging failed attempts etc)
CREATE POLICY "Anyone can insert security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_security_events_type ON public.security_events (event_type);
CREATE INDEX idx_security_events_created ON public.security_events (created_at DESC);
CREATE INDEX idx_security_events_ip ON public.security_events (ip_address);
