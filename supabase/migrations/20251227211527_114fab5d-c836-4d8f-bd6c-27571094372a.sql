-- Add bonus entry tracking columns to giveaway_entries
ALTER TABLE public.giveaway_entries 
ADD COLUMN IF NOT EXISTS social_share_bonus BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_bonus BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_giveaway_id ON public.giveaway_entries(giveaway_id);

-- Create function to select random winners for a giveaway
CREATE OR REPLACE FUNCTION public.select_giveaway_winners(p_giveaway_id UUID)
RETURNS TABLE(winner_user_id UUID, winner_discord_username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_count INT;
  v_giveaway_status TEXT;
BEGIN
  -- Get giveaway details
  SELECT winner_count, status INTO v_winner_count, v_giveaway_status
  FROM giveaways
  WHERE id = p_giveaway_id;

  IF v_giveaway_status IS NULL THEN
    RAISE EXCEPTION 'Giveaway not found';
  END IF;

  -- Check if winners already exist
  IF EXISTS (SELECT 1 FROM giveaway_winners WHERE giveaway_id = p_giveaway_id) THEN
    RAISE EXCEPTION 'Winners already selected for this giveaway';
  END IF;

  -- Create weighted entries based on entry_count and insert winners
  -- Each entry_count gives that user more chances
  WITH weighted_entries AS (
    SELECT 
      user_id,
      discord_username,
      generate_series(1, entry_count) as entry_number
    FROM giveaway_entries
    WHERE giveaway_id = p_giveaway_id
  ),
  random_winners AS (
    SELECT DISTINCT ON (user_id) 
      user_id,
      discord_username,
      random() as rand
    FROM weighted_entries
    ORDER BY user_id, rand
  ),
  selected_winners AS (
    SELECT user_id, discord_username
    FROM random_winners
    ORDER BY random()
    LIMIT v_winner_count
  )
  INSERT INTO giveaway_winners (giveaway_id, user_id, discord_username, announced_at)
  SELECT p_giveaway_id, user_id, discord_username, NOW()
  FROM selected_winners;

  -- Update is_winner flag on entries
  UPDATE giveaway_entries
  SET is_winner = true
  WHERE giveaway_id = p_giveaway_id
  AND user_id IN (SELECT user_id FROM giveaway_winners WHERE giveaway_id = p_giveaway_id);

  -- Update giveaway status to ended if not already
  UPDATE giveaways
  SET status = 'ended', updated_at = NOW()
  WHERE id = p_giveaway_id;

  -- Return the winners
  RETURN QUERY
  SELECT gw.user_id, gw.discord_username
  FROM giveaway_winners gw
  WHERE gw.giveaway_id = p_giveaway_id;
END;
$$;

-- Create function to add bonus entry
CREATE OR REPLACE FUNCTION public.add_bonus_entry(
  p_giveaway_id UUID,
  p_user_id UUID,
  p_bonus_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_entry RECORD;
  v_max_bonus INT := 2;
  v_current_bonus INT;
BEGIN
  -- Get current entry
  SELECT * INTO v_current_entry
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id AND user_id = p_user_id;

  IF v_current_entry IS NULL THEN
    RAISE EXCEPTION 'No entry found for this user in this giveaway';
  END IF;

  -- Calculate current bonus entries
  v_current_bonus := 0;
  IF v_current_entry.social_share_bonus THEN
    v_current_bonus := v_current_bonus + 1;
  END IF;
  IF v_current_entry.referral_bonus THEN
    v_current_bonus := v_current_bonus + 1;
  END IF;

  -- Check if max bonus reached
  IF v_current_bonus >= v_max_bonus THEN
    RETURN false;
  END IF;

  -- Add the bonus based on type
  IF p_bonus_type = 'social_share' THEN
    IF v_current_entry.social_share_bonus THEN
      RETURN false; -- Already claimed this bonus
    END IF;
    UPDATE giveaway_entries
    SET social_share_bonus = true, entry_count = entry_count + 1
    WHERE giveaway_id = p_giveaway_id AND user_id = p_user_id;
  ELSIF p_bonus_type = 'referral' THEN
    IF v_current_entry.referral_bonus THEN
      RETURN false; -- Already claimed this bonus
    END IF;
    UPDATE giveaway_entries
    SET referral_bonus = true, entry_count = entry_count + 1
    WHERE giveaway_id = p_giveaway_id AND user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid bonus type';
  END IF;

  RETURN true;
END;
$$;