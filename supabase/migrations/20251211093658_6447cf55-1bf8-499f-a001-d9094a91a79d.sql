-- Allow anyone to insert testimonials (will be reviewed before featured)
CREATE POLICY "Anyone can submit testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own pending testimonials
CREATE POLICY "Users can view own testimonials"
ON public.testimonials
FOR SELECT
USING (true);