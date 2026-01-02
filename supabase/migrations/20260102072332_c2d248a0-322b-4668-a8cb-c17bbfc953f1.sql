-- Create weazel_news_applications table for Weazel News job applications
CREATE TABLE public.weazel_news_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  character_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  previous_experience TEXT NOT NULL,
  why_join TEXT NOT NULL,
  character_background TEXT NOT NULL,
  journalism_experience TEXT NOT NULL,
  writing_sample TEXT NOT NULL,
  interview_scenario TEXT NOT NULL,
  camera_skills TEXT NOT NULL,
  availability TEXT NOT NULL,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weazel_news_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own weazel applications"
ON public.weazel_news_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weazel applications"
ON public.weazel_news_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all weazel applications"
ON public.weazel_news_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Admins can update weazel applications"
ON public.weazel_news_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_weazel_news_applications_updated_at
BEFORE UPDATE ON public.weazel_news_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();