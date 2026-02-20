
-- Create mini games leaderboard table
CREATE TABLE public.mini_game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  time_seconds INTEGER,
  discord_username TEXT,
  discord_id TEXT,
  discord_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mini_game_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view scores (leaderboard is public)
CREATE POLICY "Anyone can view mini game scores"
ON public.mini_game_scores FOR SELECT USING (true);

-- Authenticated users can insert their own scores
CREATE POLICY "Users can insert their own scores"
ON public.mini_game_scores FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for leaderboard queries
CREATE INDEX idx_mini_game_scores_game_type ON public.mini_game_scores (game_type, score DESC, time_seconds ASC);

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.mini_game_scores;
