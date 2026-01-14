
-- Drop the old restrictive check constraint
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_job_type_check;

-- Add a new constraint that allows all the job types used in the application forms
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_job_type_check 
CHECK (job_type = ANY (ARRAY[
  'Police Department'::text, 
  'EMS'::text, 
  'Mechanic'::text,
  'DOJ - Judge'::text,
  'DOJ - Attorney'::text
]));
