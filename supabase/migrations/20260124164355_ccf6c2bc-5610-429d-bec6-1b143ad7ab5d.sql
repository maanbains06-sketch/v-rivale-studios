-- Add business_name column to job_applications table for business job applications
ALTER TABLE public.job_applications 
ADD COLUMN business_name TEXT;