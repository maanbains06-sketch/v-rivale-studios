-- Create a public view that hides discord_id but exposes other presence data
CREATE OR REPLACE VIEW public.discord_presence_public AS
SELECT 
  id,
  staff_member_id,
  is_online,
  last_online_at,
  status,
  updated_at,
  created_at
FROM public.discord_presence;

-- Grant access to the view
GRANT SELECT ON public.discord_presence_public TO anon, authenticated;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view discord presence" ON public.discord_presence;

-- Create a new policy that only allows authenticated users to view discord_presence directly
CREATE POLICY "Authenticated users can view discord presence"
ON public.discord_presence
FOR SELECT
TO authenticated
USING (true);

-- Keep the service role policy for edge functions
-- (Already exists: "Service role can manage presence")