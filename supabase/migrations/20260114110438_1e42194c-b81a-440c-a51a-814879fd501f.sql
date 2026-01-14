-- Create member_joins table to track all member signups with live updates
CREATE TABLE IF NOT EXISTS public.member_joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discord_username TEXT,
  discord_id TEXT,
  discord_avatar TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_country TEXT,
  referral_source TEXT
);

-- Enable RLS
ALTER TABLE public.member_joins ENABLE ROW LEVEL SECURITY;

-- Only owner can view member joins
CREATE POLICY "Owner can view all member joins"
  ON public.member_joins
  FOR SELECT
  USING (public.is_owner(auth.uid()));

-- Enable realtime for member_joins
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_joins;

-- Trigger to auto-log member joins when a new profile is created
CREATE OR REPLACE FUNCTION public.log_member_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.member_joins (user_id, discord_username, discord_id, discord_avatar)
  VALUES (
    NEW.id,
    NEW.discord_username,
    NEW.discord_id,
    NEW.discord_avatar
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created_log_join ON public.profiles;

CREATE TRIGGER on_profile_created_log_join
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_member_join();

-- Add more site settings for interesting options
INSERT INTO public.site_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode to block site access'),
  ('maintenance_message', 'We are currently performing scheduled maintenance. Please check back soon!', 'Message shown during maintenance'),
  ('welcome_message', 'Welcome to SkyLife RP!', 'Welcome message for new members'),
  ('max_whitelist_per_day', '50', 'Maximum whitelist applications per day'),
  ('auto_approve_veterans', 'false', 'Auto-approve whitelist for returning players'),
  ('discord_invite_link', 'https://discord.gg/skylife', 'Discord server invite link'),
  ('twitter_handle', '@SkyLifeRP', 'Twitter/X handle for social sharing'),
  ('announcement_banner', '', 'Global announcement banner text (leave empty to hide)'),
  ('announcement_type', 'info', 'Announcement type: info, warning, success, error'),
  ('registration_enabled', 'true', 'Allow new user registrations'),
  ('support_chat_enabled', 'true', 'Enable live support chat'),
  ('gallery_submissions_enabled', 'true', 'Allow gallery submissions'),
  ('applications_paused', 'false', 'Pause all application types'),
  ('server_restart_time', '03:00', 'Daily server restart time (24h format)'),
  ('min_age_requirement', '16', 'Minimum age for whitelist applications')
ON CONFLICT (key) DO NOTHING;