
-- Create debates table
CREATE TABLE public.debates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 100,
  discord_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debate participants table
CREATE TABLE public.debate_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id UUID NOT NULL REFERENCES public.debates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar TEXT,
  role TEXT NOT NULL DEFAULT 'listener',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(debate_id, user_id)
);

-- Create debate messages (live feed)
CREATE TABLE public.debate_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id UUID NOT NULL REFERENCES public.debates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_messages ENABLE ROW LEVEL SECURITY;

-- Debates: anyone can view active debates, owner can manage
CREATE POLICY "Anyone can view debates" ON public.debates FOR SELECT USING (true);
CREATE POLICY "Owner can manage debates" ON public.debates FOR ALL USING (public.is_owner(auth.uid()));

-- Participants: anyone can view, authenticated users can join/leave
CREATE POLICY "Anyone can view participants" ON public.debate_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join debates" ON public.debate_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave debates" ON public.debate_participants FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Owner can manage participants" ON public.debate_participants FOR ALL USING (public.is_owner(auth.uid()));

-- Messages: anyone can view, authenticated users can post
CREATE POLICY "Anyone can view debate messages" ON public.debate_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post messages" ON public.debate_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can manage messages" ON public.debate_messages FOR ALL USING (public.is_owner(auth.uid()));

-- Enable realtime for live feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.debate_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debate_participants;

-- Trigger for updated_at
CREATE TRIGGER update_debates_updated_at
  BEFORE UPDATE ON public.debates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
