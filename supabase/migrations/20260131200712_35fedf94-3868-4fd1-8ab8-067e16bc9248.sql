-- Add DELETE policy for support_tickets table
CREATE POLICY "Staff can delete tickets" 
ON public.support_tickets 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role) 
  OR is_owner(auth.uid())
);