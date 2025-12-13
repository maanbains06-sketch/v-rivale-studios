-- Create a table for DOT (Department of Transportation) applications
CREATE TABLE public.dot_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  real_name TEXT NOT NULL,
  in_game_name TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  steam_id TEXT NOT NULL,
  weekly_availability TEXT NOT NULL,
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dot_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own DOT applications" 
ON public.dot_applications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create their own DOT applications" 
ON public.dot_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins and moderators can view all applications
CREATE POLICY "Admins can view all DOT applications" 
ON public.dot_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Admins can update applications (for review)
CREATE POLICY "Admins can update DOT applications" 
ON public.dot_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Admins can delete applications
CREATE POLICY "Admins can delete DOT applications" 
ON public.dot_applications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dot_applications_updated_at
BEFORE UPDATE ON public.dot_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();