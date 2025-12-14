-- Fix discord_presence_public to only be accessible by authenticated users
-- Drop the public grants and restrict access
REVOKE SELECT ON public.discord_presence_public FROM anon;

-- Add RLS policy for profiles table to protect user data
-- First check current policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create proper RLS policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Restrict job applications phone numbers to admins only
DROP POLICY IF EXISTS "Admins can update all job applications" ON public.job_applications;
CREATE POLICY "Admins can update all job applications"
ON public.job_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Restrict PDM applications phone numbers to admins only  
DROP POLICY IF EXISTS "Admins can update DOT applications" ON public.pdm_applications;
DROP POLICY IF EXISTS "Admins can update PDM applications" ON public.pdm_applications;
CREATE POLICY "Admins can update PDM applications"
ON public.pdm_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));