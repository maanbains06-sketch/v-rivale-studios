-- Create department_rosters table to store roster entries for each department
CREATE TABLE public.department_rosters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'General',
  callsign TEXT,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  department_logs TEXT DEFAULT '0 Misconducts',
  discord_id TEXT,
  sub_department TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.department_rosters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view rosters (public data)
CREATE POLICY "Anyone can view rosters" 
ON public.department_rosters 
FOR SELECT 
USING (true);

-- Allow admins and staff to manage rosters
CREATE POLICY "Admins can manage rosters" 
ON public.department_rosters 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'moderator')
  )
);

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_department_rosters_updated_at
BEFORE UPDATE ON public.department_rosters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample data
INSERT INTO public.department_rosters (department, section, callsign, name, rank, status, department_logs, discord_id, sub_department, display_order) VALUES
-- Police Department
('police', 'High Command', 'PD-101', 'Chief Johnson', 'Chief of Police', 'Active', '0 Misconducts', NULL, 'Command', 1),
('police', 'High Command', 'PD-102', 'Deputy Martinez', 'Assistant Chief', 'Active', '0 Misconducts', NULL, 'Command', 2),
('police', 'Command Staff', 'PD-201', 'Captain Williams', 'Captain', 'Active', '0 Misconducts', NULL, 'Patrol', 3),
('police', 'Command Staff', 'PD-202', 'Captain Davis', 'Captain', 'Active', '1 Misconduct', NULL, 'Detective', 4),
('police', 'Supervisors', 'PD-301', 'Sergeant Miller', 'Sergeant', 'Active', '0 Misconducts', NULL, 'Patrol', 5),
('police', 'Supervisors', 'PD-302', 'Sergeant Wilson', 'Sergeant', 'LOA', '0 Misconducts', NULL, 'SWAT', 6),
('police', 'Officers', 'PD-401', 'Officer Brown', 'Senior Officer', 'Active', '0 Misconducts', NULL, 'Patrol', 7),
('police', 'Officers', 'PD-402', 'Officer Garcia', 'Officer', 'In Training', '0 Misconducts', NULL, 'Patrol', 8),

-- EMS Department
('ems', 'High Command', 'EMS-101', 'Director Smith', 'EMS Director', 'Active', '0 Misconducts', NULL, 'Command', 1),
('ems', 'High Command', 'EMS-102', 'Deputy Anderson', 'Deputy Director', 'Active', '0 Misconducts', NULL, 'Command', 2),
('ems', 'Supervisors', 'EMS-201', 'Supervisor Lee', 'Senior Supervisor', 'Active', '0 Misconducts', NULL, 'Medical', 3),
('ems', 'Paramedics', 'EMS-301', 'Paramedic Taylor', 'Lead Paramedic', 'Active', '0 Misconducts', NULL, 'Field', 4),
('ems', 'Paramedics', 'EMS-302', 'Paramedic White', 'Paramedic', 'Active', '0 Misconducts', NULL, 'Field', 5),
('ems', 'EMTs', 'EMS-401', 'EMT Harris', 'Senior EMT', 'Active', '0 Misconducts', NULL, 'Basic', 6),

-- Fire Department
('fire', 'High Command', 'FD-101', 'Chief Roberts', 'Fire Chief', 'Active', '0 Misconducts', NULL, 'Command', 1),
('fire', 'High Command', 'FD-102', 'Deputy Clark', 'Deputy Chief', 'Active', '0 Misconducts', NULL, 'Command', 2),
('fire', 'Captains', 'FD-201', 'Captain Young', 'Station Captain', 'Active', '0 Misconducts', NULL, 'Station 1', 3),
('fire', 'Firefighters', 'FD-301', 'FF Hall', 'Senior Firefighter', 'Active', '0 Misconducts', NULL, 'Engine', 4),
('fire', 'Firefighters', 'FD-302', 'FF King', 'Firefighter', 'In Training', '0 Misconducts', NULL, 'Ladder', 5),

-- DOJ Department
('doj', 'Judges', 'DOJ-101', 'Hon. Thompson', 'Chief Justice', 'Active', '0 Misconducts', NULL, 'Supreme Court', 1),
('doj', 'Judges', 'DOJ-102', 'Hon. Wright', 'Senior Judge', 'Active', '0 Misconducts', NULL, 'District Court', 2),
('doj', 'Attorneys', 'DOJ-201', 'Atty. Green', 'District Attorney', 'Active', '0 Misconducts', NULL, 'Prosecution', 3),
('doj', 'Attorneys', 'DOJ-202', 'Atty. Adams', 'Public Defender', 'Active', '0 Misconducts', NULL, 'Defense', 4),

-- Mechanic Department
('mechanic', 'Management', 'MECH-101', 'Manager Scott', 'Shop Manager', 'Active', '0 Misconducts', NULL, 'Main Shop', 1),
('mechanic', 'Senior Mechanics', 'MECH-201', 'Mech. Turner', 'Lead Mechanic', 'Active', '0 Misconducts', NULL, 'Engine', 2),
('mechanic', 'Mechanics', 'MECH-301', 'Mech. Baker', 'Mechanic', 'Active', '0 Misconducts', NULL, 'Body', 3),

-- PDM Department  
('pdm', 'Management', 'PDM-101', 'Director Evans', 'Sales Director', 'Active', '0 Misconducts', NULL, 'Luxury', 1),
('pdm', 'Sales Team', 'PDM-201', 'Sales Campbell', 'Senior Salesperson', 'Active', '0 Misconducts', NULL, 'Sports', 2),
('pdm', 'Sales Team', 'PDM-202', 'Sales Mitchell', 'Salesperson', 'Active', '0 Misconducts', NULL, 'Economy', 3);

-- Enable realtime for rosters
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_rosters;