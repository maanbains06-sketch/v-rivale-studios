-- Create table for page-specific maintenance settings
CREATE TABLE IF NOT EXISTS public.page_maintenance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT,
  cooldown_minutes INTEGER DEFAULT 30,
  enabled_at TIMESTAMP WITH TIME ZONE,
  scheduled_end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.page_maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view page maintenance settings (needed for frontend checks)
CREATE POLICY "Anyone can view page maintenance settings"
ON public.page_maintenance_settings
FOR SELECT
USING (true);

-- Only owner/admin can manage page maintenance settings
CREATE POLICY "Owner/admin can manage page maintenance settings"
ON public.page_maintenance_settings
FOR ALL
USING (
  is_owner(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin')
  ))
)
WITH CHECK (
  is_owner(auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin')
  ))
);

-- Insert default page maintenance settings for all pages
INSERT INTO public.page_maintenance_settings (page_key, page_name, maintenance_message) VALUES
  ('about', 'About', 'The About page is currently under maintenance.'),
  ('features', 'Features', 'The Features page is currently under maintenance.'),
  ('rules', 'Rules', 'The Rules page is currently under maintenance.'),
  ('community', 'Community', 'The Community page is currently under maintenance.'),
  ('whitelist', 'Whitelist', 'The Whitelist page is currently under maintenance.'),
  ('staff', 'Staff', 'The Staff page is currently under maintenance.'),
  ('ban-appeal', 'Ban Appeal', 'The Ban Appeal page is currently under maintenance.'),
  ('guides', 'Guides', 'The Guides page is currently under maintenance.'),
  ('gallery', 'Gallery', 'The Gallery page is currently under maintenance.'),
  ('support', 'Support', 'The Support page is currently under maintenance.'),
  ('support-chat', 'Support Chat', 'The Support Chat page is currently under maintenance.'),
  ('job-application', 'Job Application', 'The Job Application page is currently under maintenance.'),
  ('gang-rp', 'Gang RP', 'The Gang RP page is currently under maintenance.'),
  ('feedback', 'Feedback', 'The Feedback page is currently under maintenance.'),
  ('giveaway', 'Giveaway', 'The Giveaway page is currently under maintenance.'),
  ('roster', 'Roster', 'The Roster page is currently under maintenance.'),
  ('privacy-policy', 'Privacy Policy', 'The Privacy Policy page is currently under maintenance.'),
  ('terms-of-service', 'Terms of Service', 'The Terms of Service page is currently under maintenance.'),
  ('refund-policy', 'Refund Policy', 'The Refund Policy page is currently under maintenance.'),
  ('dashboard', 'Dashboard', 'The Dashboard page is currently under maintenance.')
ON CONFLICT (page_key) DO NOTHING;

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_maintenance_settings;