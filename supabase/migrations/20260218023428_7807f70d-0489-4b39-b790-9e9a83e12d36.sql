
-- Add discord_id and server_name columns to award_poll_nominees
ALTER TABLE public.award_poll_nominees 
  ADD COLUMN IF NOT EXISTS discord_id TEXT,
  ADD COLUMN IF NOT EXISTS discord_username TEXT,
  ADD COLUMN IF NOT EXISTS server_name TEXT;

-- Add discord_id and server_name to award_hall_of_fame for winner tagging
ALTER TABLE public.award_hall_of_fame
  ADD COLUMN IF NOT EXISTS winner_discord_id TEXT,
  ADD COLUMN IF NOT EXISTS winner_server_name TEXT;
