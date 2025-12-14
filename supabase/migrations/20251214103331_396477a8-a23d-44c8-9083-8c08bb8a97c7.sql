-- Add timezone column to staff_members table
ALTER TABLE public.staff_members 
ADD COLUMN timezone TEXT DEFAULT 'America/New_York';

-- Add a comment for documentation
COMMENT ON COLUMN public.staff_members.timezone IS 'Staff member timezone for availability display';