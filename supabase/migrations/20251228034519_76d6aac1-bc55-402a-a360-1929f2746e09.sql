-- Add a service role policy for edge functions to read rules
CREATE POLICY "Service role can read rules" 
ON public.discord_rules_sections 
FOR SELECT 
USING (true);