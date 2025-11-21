-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('police', 'ems', 'mechanic')),
  
  -- Personal Information
  character_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  
  -- Experience and Background
  previous_experience TEXT NOT NULL,
  why_join TEXT NOT NULL,
  character_background TEXT NOT NULL,
  
  -- Job Specific
  availability TEXT NOT NULL,
  additional_info TEXT,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'interview')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own applications
CREATE POLICY "Users can insert own job applications"
ON public.job_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own applications
CREATE POLICY "Users can view own job applications"
ON public.job_applications
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending job applications"
ON public.job_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can update all applications
CREATE POLICY "Admins can update all job applications"
ON public.job_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();