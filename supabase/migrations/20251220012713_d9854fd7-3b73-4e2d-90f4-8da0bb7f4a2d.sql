-- Add strikes column to department_rosters
ALTER TABLE public.department_rosters ADD COLUMN IF NOT EXISTS strikes integer DEFAULT 0;

-- Create roster_owner_access table for owner Discord IDs with full access
CREATE TABLE IF NOT EXISTS public.roster_owner_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roster_owner_access ENABLE ROW LEVEL SECURITY;

-- Allow public to view owner access (to check permissions)
CREATE POLICY "Anyone can view roster owners" ON public.roster_owner_access FOR SELECT USING (true);

-- Only admins can modify owner access
CREATE POLICY "Admins can manage roster owners" ON public.roster_owner_access FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Insert the owner's Discord ID
INSERT INTO public.roster_owner_access (discord_id, name) VALUES ('833680146510381097', 'Owner') ON CONFLICT (discord_id) DO NOTHING;

-- Update roster_edit_permissions with the actual Discord role IDs
DELETE FROM public.roster_edit_permissions;

INSERT INTO public.roster_edit_permissions (department, discord_role_id, discord_role_name) VALUES
  ('police', '1451442274037923960', 'PD High Command'),
  ('ems', '1451442460910817371', 'EMS High Command'),
  ('fire', '1451442569018998916', 'Fire High Command'),
  ('doj', '1451442686115581963', 'DOJ High Command'),
  ('mechanic', '1451442834229039104', 'Mechanic Management'),
  ('pdm', '1451747382592012380', 'PDM Management');

-- Add shop_name column to department_rosters for mechanic/pdm shops
ALTER TABLE public.department_rosters ADD COLUMN IF NOT EXISTS shop_name TEXT;