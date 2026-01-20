-- Drop the old department check constraint
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_department_check;

-- Add new department check constraint with all roster departments
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_department_check 
CHECK (department = ANY (ARRAY[
  -- Original values
  'leadership'::text, 
  'administration'::text, 
  'management'::text, 
  'development'::text, 
  'moderation'::text, 
  'support'::text, 
  'staff'::text, 
  'events'::text,
  -- Roster department values
  'police'::text,
  'pd'::text,
  'ems'::text,
  'fire'::text,
  'mechanic'::text,
  'doj'::text,
  'weazel'::text,
  'pdm'::text,
  'gang'::text,
  'state'::text
]));

-- Drop the old role_type check constraint
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_role_type_check;

-- Add new role_type check constraint with more values
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_role_type_check 
CHECK (role_type = ANY (ARRAY[
  'owner'::text, 
  'admin'::text, 
  'moderator'::text, 
  'developer'::text, 
  'staff'::text, 
  'event_manager'::text,
  'user'::text,
  'member'::text
]));