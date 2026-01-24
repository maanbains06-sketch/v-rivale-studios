-- Create business_applications table for business proposals
CREATE TABLE public.business_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('real_estate', 'food_joint', 'mechanic_shop', 'tuner_shop')),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  discord_id TEXT,
  phone_number TEXT NOT NULL,
  investment_amount TEXT NOT NULL,
  location_preference TEXT NOT NULL,
  business_plan TEXT NOT NULL,
  previous_experience TEXT NOT NULL,
  why_this_business TEXT NOT NULL,
  employee_count TEXT NOT NULL,
  operating_hours TEXT NOT NULL,
  unique_selling_point TEXT NOT NULL,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'on_hold')),
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own business applications" 
ON public.business_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business applications" 
ON public.business_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for staff to view all applications
CREATE POLICY "Staff can view all business applications"
ON public.business_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Create policy for staff to update applications
CREATE POLICY "Staff can update business applications"
ON public.business_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_applications_updated_at
BEFORE UPDATE ON public.business_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();