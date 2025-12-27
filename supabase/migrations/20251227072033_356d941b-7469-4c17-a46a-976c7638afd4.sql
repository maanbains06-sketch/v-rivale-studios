-- Create giveaways table
CREATE TABLE public.giveaways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  prize_image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_entries INTEGER,
  winner_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'cancelled')),
  requirements JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create giveaway_entries table
CREATE TABLE public.giveaway_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discord_username TEXT,
  entry_count INTEGER NOT NULL DEFAULT 1,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id)
);

-- Create giveaway_winners table
CREATE TABLE public.giveaway_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discord_username TEXT,
  prize_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  announced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;

-- Giveaways policies (public read, admin write)
CREATE POLICY "Anyone can view active giveaways" 
ON public.giveaways 
FOR SELECT 
USING (status IN ('upcoming', 'active', 'ended'));

CREATE POLICY "Admins can manage giveaways" 
ON public.giveaways 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Giveaway entries policies
CREATE POLICY "Users can view their own entries" 
ON public.giveaway_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can enter giveaways" 
ON public.giveaway_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries" 
ON public.giveaway_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Giveaway winners policies
CREATE POLICY "Anyone can view winners" 
ON public.giveaway_winners 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage winners" 
ON public.giveaway_winners 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_giveaway_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_giveaways_updated_at
BEFORE UPDATE ON public.giveaways
FOR EACH ROW
EXECUTE FUNCTION public.update_giveaway_updated_at();

-- Enable realtime for giveaways
ALTER PUBLICATION supabase_realtime ADD TABLE public.giveaways;
ALTER PUBLICATION supabase_realtime ADD TABLE public.giveaway_entries;