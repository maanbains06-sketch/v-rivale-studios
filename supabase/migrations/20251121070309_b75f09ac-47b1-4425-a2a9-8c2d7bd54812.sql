-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  player_role TEXT,
  avatar_url TEXT,
  testimonial TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view featured testimonials
CREATE POLICY "Anyone can view featured testimonials"
ON public.testimonials
FOR SELECT
USING (is_featured = true);

-- Admins can view all testimonials
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert testimonials
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update testimonials
CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete testimonials
CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample testimonials
INSERT INTO public.testimonials (player_name, player_role, testimonial, rating, is_featured) VALUES
('Alex Rodriguez', 'Veteran Player', 'Best RP server I''ve ever played on! The community is amazing and the staff are always helpful. The custom features make it feel so immersive.', 5, true),
('Sarah Mitchell', 'Business Owner', 'The economy system is incredibly detailed. I''ve built my entire business empire here and the mechanics are just perfect. Highly recommend!', 5, true),
('Mike Chen', 'Police Officer', 'Being part of the LSPD here has been an incredible experience. The realistic scenarios and professional atmosphere make every day unique.', 5, true),
('Emma Johnson', 'Regular Player', 'I''ve been playing for 6 months and I''m still discovering new things. The server performance is great and the events are always fun!', 4, true),
('David Wilson', 'EMS Paramedic', 'The medical RP here is top-notch. Staff are responsive and the community really values quality roleplay. This is home now!', 5, true);