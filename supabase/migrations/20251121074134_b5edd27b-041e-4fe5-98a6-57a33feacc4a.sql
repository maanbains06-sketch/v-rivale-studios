-- Create staff_applications table
CREATE TABLE public.staff_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  discord_username TEXT NOT NULL,
  in_game_name TEXT NOT NULL,
  position TEXT NOT NULL,
  playtime TEXT NOT NULL,
  experience TEXT NOT NULL,
  why_join TEXT NOT NULL,
  availability TEXT NOT NULL,
  previous_experience TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own staff applications
CREATE POLICY "Users can insert own staff applications"
ON public.staff_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own staff applications
CREATE POLICY "Users can view own staff applications"
ON public.staff_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Users can update their own pending staff applications
CREATE POLICY "Users can update own pending staff applications"
ON public.staff_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can update all staff applications
CREATE POLICY "Admins can update all staff applications"
ON public.staff_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_applications_updated_at
BEFORE UPDATE ON public.staff_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();