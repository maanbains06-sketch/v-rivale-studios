-- Create table for featured positions management
CREATE TABLE public.featured_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL DEFAULT 'Government',
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('critical', 'high', 'medium')),
  spots INTEGER NOT NULL DEFAULT 1,
  is_hiring BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_positions ENABLE ROW LEVEL SECURITY;

-- Public can view featured positions that are hiring
CREATE POLICY "Anyone can view featured positions"
  ON public.featured_positions
  FOR SELECT
  USING (true);

-- Only owner can manage featured positions
CREATE POLICY "Owner can manage featured positions"
  ON public.featured_positions
  FOR ALL
  USING (public.is_owner(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_featured_positions_updated_at
  BEFORE UPDATE ON public.featured_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default featured positions
INSERT INTO public.featured_positions (job_id, name, description, department, urgency, spots, is_hiring, display_order)
VALUES 
  ('police', 'Police Officer', 'Join LSPD and uphold justice. Critical need for dedicated officers to maintain law and order.', 'Government', 'critical', 3, true, 1),
  ('ems', 'EMS Paramedic', 'Save lives in San Andreas. Emergency medical services desperately need skilled paramedics.', 'Government', 'critical', 5, true, 2),
  ('firefighter', 'Firefighter', 'Battle blazes and rescue citizens. The fire department needs brave individuals.', 'Government', 'high', 4, true, 3),
  ('business-mechanic', 'Shop Mechanic', 'Multiple mechanic shops are hiring. Technical skills required for vehicle repairs.', 'Business', 'high', 6, true, 4),
  ('business-food-joint', 'Restaurant Staff', 'Join the hospitality industry. Restaurants across the city are looking for staff.', 'Business', 'medium', 8, true, 5),
  ('weazel-news', 'News Reporter', 'Report breaking news and cover the biggest stories in Los Santos.', 'Media', 'medium', 2, true, 6);

-- Add business_jobs_hidden setting if it doesn't exist
INSERT INTO public.site_settings (key, value, description)
VALUES ('business_jobs_hidden', 'false', 'Hide business jobs section from non-owner users')
ON CONFLICT (key) DO NOTHING;