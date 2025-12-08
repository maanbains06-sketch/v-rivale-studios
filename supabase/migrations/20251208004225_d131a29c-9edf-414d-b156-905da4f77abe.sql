-- 1. Drop overly permissive referral_codes policy
DROP POLICY IF EXISTS "Anyone can view referral codes by code" ON public.referral_codes;

-- 2. Drop overly permissive staff_members policy
DROP POLICY IF EXISTS "Public can view limited staff info" ON public.staff_members;

-- 3. Create new authenticated-only policy for staff_members
CREATE POLICY "Authenticated users can view active staff"
ON public.staff_members
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- 4. Create PDM applications table
CREATE TABLE IF NOT EXISTS public.pdm_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  character_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  previous_experience TEXT NOT NULL,
  why_join TEXT NOT NULL,
  character_background TEXT NOT NULL,
  sales_experience TEXT NOT NULL,
  vehicle_knowledge TEXT NOT NULL,
  customer_scenario TEXT NOT NULL,
  availability TEXT NOT NULL,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdm_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for pdm_applications
CREATE POLICY "Users can insert own PDM applications"
ON public.pdm_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own PDM applications"
ON public.pdm_applications
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users can update own pending PDM applications"
ON public.pdm_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all PDM applications"
ON public.pdm_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pdm_applications_updated_at
BEFORE UPDATE ON public.pdm_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();