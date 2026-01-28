-- Add a general departments column for all panel types
ALTER TABLE public.panel_access 
ADD COLUMN IF NOT EXISTS departments text[] DEFAULT NULL;

-- Migrate existing roster_departments data to the new departments column
UPDATE public.panel_access 
SET departments = roster_departments 
WHERE roster_departments IS NOT NULL AND departments IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.panel_access.departments IS 'Stores department access for any panel type (business, job, roster, admin, contract)';