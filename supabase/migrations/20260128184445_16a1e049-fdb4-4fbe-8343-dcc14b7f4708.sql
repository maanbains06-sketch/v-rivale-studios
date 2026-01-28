-- Add roster_departments column to panel_access for specific roster access
ALTER TABLE public.panel_access 
ADD COLUMN roster_departments text[] DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.panel_access.roster_departments IS 'Array of department keys (police, ems, fire, etc.) this user can access when panel_type is roster';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_panel_access_roster_departments ON public.panel_access USING GIN (roster_departments);

-- Create a function to check if user has roster access to a specific department
CREATE OR REPLACE FUNCTION public.has_roster_department_access(
  _discord_id text,
  _department text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.panel_access
    WHERE discord_id = _discord_id
      AND panel_type = 'roster'
      AND is_active = true
      AND (
        roster_departments IS NULL 
        OR _department = ANY(roster_departments)
        OR 'all' = ANY(roster_departments)
      )
  )
$$;

-- Create a function to get all accessible roster departments for a user
CREATE OR REPLACE FUNCTION public.get_roster_departments_for_user(
  _discord_id text
)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN 'all' = ANY(COALESCE(roster_departments, ARRAY['all']::text[])) 
            OR roster_departments IS NULL 
          THEN ARRAY['police', 'ems', 'fire', 'mechanic', 'doj', 'state', 'weazel', 'pdm', 'staff']
          ELSE roster_departments
        END
      FROM public.panel_access
      WHERE discord_id = _discord_id
        AND panel_type = 'roster'
        AND is_active = true
      LIMIT 1
    ),
    ARRAY[]::text[]
  )
$$;