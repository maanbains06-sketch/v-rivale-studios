-- Create team capacity settings table
CREATE TABLE public.staff_team_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_value text NOT NULL UNIQUE,
  team_label text NOT NULL,
  team_description text,
  max_members integer NOT NULL DEFAULT 3,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_team_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view team settings (for application form)
CREATE POLICY "Anyone can view team settings"
ON public.staff_team_settings
FOR SELECT
USING (true);

-- Only admins can manage team settings
CREATE POLICY "Admins can manage team settings"
ON public.staff_team_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default team settings
INSERT INTO public.staff_team_settings (team_value, team_label, team_description, max_members) VALUES
('administration_team', 'Administration Team', 'Server management, policy enforcement, staff coordination', 3),
('staff_team', 'Staff Team', 'Community safety, rule enforcement, player support', 3),
('support_team', 'Support Team', 'Player assistance, ticket management, issue resolution', 3),
('event_team', 'Event Team', 'Event planning, hosting, community engagement', 3);

-- Add trigger for updated_at
CREATE TRIGGER update_staff_team_settings_updated_at
BEFORE UPDATE ON public.staff_team_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();