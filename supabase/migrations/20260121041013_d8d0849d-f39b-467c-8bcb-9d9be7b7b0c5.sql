-- Add discord_id column to whitelist_applications
ALTER TABLE public.whitelist_applications 
ADD COLUMN IF NOT EXISTS discord_id text;

-- Add discord_id column to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS discord_id text;

-- Add discord_id column to ban_appeals
ALTER TABLE public.ban_appeals 
ADD COLUMN IF NOT EXISTS discord_id text;

-- Add discord_id column to staff_applications
ALTER TABLE public.staff_applications 
ADD COLUMN IF NOT EXISTS discord_id text;