-- Create table for managing business types
CREATE TABLE public.business_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Briefcase',
    color TEXT DEFAULT 'bg-gray-500',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active business types"
ON public.business_types
FOR SELECT
USING (is_active = true);

CREATE POLICY "Owner can manage business types"
ON public.business_types
FOR ALL
USING (public.is_owner(auth.uid()));

-- Insert default business types
INSERT INTO public.business_types (name, slug, icon, color, display_order) VALUES
('Real Estate', 'real-estate', 'Building2', 'bg-blue-500', 1),
('Food Joint', 'food-joint', 'Store', 'bg-orange-500', 2),
('Mechanic Shop', 'mechanic-shop', 'Wrench', 'bg-gray-500', 3),
('Tuner Shop', 'tuner-shop', 'Car', 'bg-purple-500', 4),
('Entertainment', 'entertainment', 'Music', 'bg-pink-500', 5);

-- Add trigger for updated_at
CREATE TRIGGER update_business_types_updated_at
    BEFORE UPDATE ON public.business_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();