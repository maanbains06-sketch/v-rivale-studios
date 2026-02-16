
-- Award categories table
CREATE TABLE public.award_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nominations table
CREATE TABLE public.award_nominations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  nominee_name TEXT NOT NULL,
  nominated_by UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes table
CREATE TABLE public.award_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomination_id UUID NOT NULL REFERENCES public.award_nominations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nomination_id, user_id)
);

-- Enable RLS
ALTER TABLE public.award_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_votes ENABLE ROW LEVEL SECURITY;

-- Categories: everyone can read, only owners can manage
CREATE POLICY "Anyone can view active categories" ON public.award_categories FOR SELECT USING (true);

-- Nominations: authenticated users can nominate, everyone can view approved
CREATE POLICY "Anyone can view approved nominations" ON public.award_nominations FOR SELECT USING (status = 'approved' OR nominated_by = auth.uid());
CREATE POLICY "Authenticated users can nominate" ON public.award_nominations FOR INSERT WITH CHECK (auth.uid() = nominated_by);

-- Votes: authenticated users can vote, everyone can see vote counts
CREATE POLICY "Anyone can view votes" ON public.award_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.award_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote" ON public.award_votes FOR DELETE USING (auth.uid() = user_id);

-- Seed default categories
INSERT INTO public.award_categories (name, slug, description, icon, display_order) VALUES
  ('Best Gang', 'best-gang', 'The most feared, respected, and roleplay-driven gang in Skylife Roleplay India.', '🔫', 1),
  ('Best Officer', 'best-officer', 'The most dedicated and fair law enforcement officer serving the city.', '👮', 2),
  ('Best Business', 'best-business', 'The most successful and creative business in the city.', '🏢', 3),
  ('Best RP Moment', 'best-rp-moment', 'The most memorable and immersive roleplay moment of the year.', '🎬', 4);

-- Trigger for updated_at
CREATE TRIGGER update_award_categories_updated_at BEFORE UPDATE ON public.award_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_award_nominations_updated_at BEFORE UPDATE ON public.award_nominations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
