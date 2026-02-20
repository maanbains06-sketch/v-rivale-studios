-- Enable realtime for mini_game_scores table (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'mini_game_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mini_game_scores;
  END IF;
END $$;