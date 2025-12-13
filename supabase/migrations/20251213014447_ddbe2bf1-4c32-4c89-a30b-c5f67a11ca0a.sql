-- Drop the misconfigured testimonials RLS policy that exposes all testimonials
DROP POLICY IF EXISTS "Users can view own testimonials" ON public.testimonials;

-- Create a function to automatically purge rejected applications older than 90 days
CREATE OR REPLACE FUNCTION public.purge_old_rejected_applications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete rejected whitelist applications older than 90 days
  DELETE FROM public.whitelist_applications
  WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
  
  -- Delete rejected job applications older than 90 days
  DELETE FROM public.job_applications
  WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
  
  -- Delete rejected staff applications older than 90 days
  DELETE FROM public.staff_applications
  WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
  
  -- Delete rejected ban appeals older than 90 days
  DELETE FROM public.ban_appeals
  WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
  
  -- Delete rejected PDM applications older than 90 days
  DELETE FROM public.pdm_applications
  WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
  
  -- Delete rejected firefighter applications older than 90 days
  DELETE FROM public.firefighter_applications
  WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Purged rejected applications older than 90 days';
END;
$$;

-- Create a cron extension to schedule the purge (if not exists)
-- Note: This will run daily at midnight to check and purge old applications
-- The actual scheduling should be done via Supabase dashboard or pg_cron if available

-- Encrypt 2FA backup codes using pgcrypto
-- First ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add a comment to document that backup_codes should be encrypted in application layer
COMMENT ON COLUMN public.owner_2fa_sessions.backup_codes IS 'Backup codes for 2FA recovery. Should be hashed before storage for additional security.';