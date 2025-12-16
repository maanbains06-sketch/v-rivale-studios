-- Add policy for service role to manage events (for Discord sync)
CREATE POLICY "Service role can manage events" 
ON public.events 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also update the event directly to mark it completed
UPDATE public.events 
SET status = 'completed', updated_at = now() 
WHERE discord_event_id = '1450446147784282112';