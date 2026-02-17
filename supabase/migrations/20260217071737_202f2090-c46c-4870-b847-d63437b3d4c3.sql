
-- Add more award categories
INSERT INTO award_categories (name, slug, description, icon, display_order, is_active) VALUES
  ('Best Doctor', 'best-doctor', 'The most dedicated doctor in the city', '🏥', 5, true),
  ('Best Mechanic', 'best-mechanic', 'The best mechanic keeping vehicles running', '🔧', 6, true),
  ('Best Lawyer', 'best-lawyer', 'The most skilled attorney in the city', '⚖️', 7, true),
  ('Best News Reporter', 'best-news-reporter', 'The best journalist covering city stories', '📺', 8, true)
ON CONFLICT DO NOTHING;

-- Award polls table - owner creates weekly polls with nominees and prizes
CREATE TABLE IF NOT EXISTS public.award_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.award_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT,
  prize_image_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  winner_nomination_id UUID REFERENCES public.award_nominations(id) ON DELETE SET NULL,
  winner_announced_at TIMESTAMPTZ,
  winner_discord_message_id TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Poll nominees - link nominations to a specific poll
CREATE TABLE IF NOT EXISTS public.award_poll_nominees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.award_polls(id) ON DELETE CASCADE,
  nomination_id UUID REFERENCES public.award_nominations(id) ON DELETE CASCADE,
  nominee_name TEXT NOT NULL,
  nominee_image_url TEXT,
  nominee_description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Poll votes - one vote per user per poll
CREATE TABLE IF NOT EXISTS public.award_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.award_polls(id) ON DELETE CASCADE,
  poll_nominee_id UUID NOT NULL REFERENCES public.award_poll_nominees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Hall of Fame archive
CREATE TABLE IF NOT EXISTS public.award_hall_of_fame (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.award_polls(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  winner_image_url TEXT,
  prize TEXT,
  vote_count INT DEFAULT 0,
  total_votes INT DEFAULT 0,
  week_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Award visibility toggle setting
INSERT INTO public.site_settings (key, value, description)
VALUES ('awards_hidden', 'false', 'When true, the awards section is hidden from all users except owner')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.award_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_poll_nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_hall_of_fame ENABLE ROW LEVEL SECURITY;

-- Polls: everyone can view active polls, owner can manage
CREATE POLICY "Anyone can view active polls" ON public.award_polls FOR SELECT USING (true);
CREATE POLICY "Owner can manage polls" ON public.award_polls FOR ALL USING (public.is_owner(auth.uid()));

-- Poll nominees: everyone can view
CREATE POLICY "Anyone can view poll nominees" ON public.award_poll_nominees FOR SELECT USING (true);
CREATE POLICY "Owner can manage poll nominees" ON public.award_poll_nominees FOR ALL USING (public.is_owner(auth.uid()));

-- Poll votes: authenticated users can vote, everyone can view
CREATE POLICY "Anyone can view poll votes" ON public.award_poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.award_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own vote" ON public.award_poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Hall of fame: public viewing
CREATE POLICY "Anyone can view hall of fame" ON public.award_hall_of_fame FOR SELECT USING (true);
CREATE POLICY "Owner can manage hall of fame" ON public.award_hall_of_fame FOR ALL USING (public.is_owner(auth.uid()));

-- Enable realtime for live voting
ALTER PUBLICATION supabase_realtime ADD TABLE public.award_poll_votes;
