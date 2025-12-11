-- Allow owner to delete testimonials  
CREATE POLICY "Owner can delete testimonials"
ON public.testimonials
FOR DELETE
USING (is_owner(auth.uid()));

-- Allow owner to update testimonials
CREATE POLICY "Owner can update testimonials"
ON public.testimonials
FOR UPDATE
USING (is_owner(auth.uid()));