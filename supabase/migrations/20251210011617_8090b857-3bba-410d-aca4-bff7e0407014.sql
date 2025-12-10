-- Tighten promo_codes RLS SELECT policy
DROP POLICY IF EXISTS "Anyone can view unused promo codes by code" ON public.promo_codes;

CREATE POLICY "Users can only view own promo codes or ones they used"
ON public.promo_codes
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = used_by);

-- Add settings for staff positions management
INSERT INTO public.site_settings (key, value, description)
VALUES 
  ('staff_positions_enabled', 'administrator,moderator,support_staff,event_coordinator', 'Comma-separated list of enabled staff positions for applications'),
  ('fivem_server_connect', 'fivem://connect/cfx.re/join/abc123', 'FiveM server connection URL')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;