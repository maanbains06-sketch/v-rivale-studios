-- Add new columns to job_applications table
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS job_specific_answer TEXT,
ADD COLUMN IF NOT EXISTS strengths TEXT;

-- Update existing records to have empty strings for new columns (to avoid null issues)
UPDATE job_applications 
SET job_specific_answer = '', strengths = '' 
WHERE job_specific_answer IS NULL OR strengths IS NULL;