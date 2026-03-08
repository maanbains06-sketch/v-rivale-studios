
-- Cinema rooms table
CREATE TABLE public.cinema_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_by_username TEXT,
  created_by_avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 20,
  embed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cinema room members
CREATE TABLE public.cinema_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.cinema_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  discord_username TEXT,
  discord_avatar TEXT,
  is_muted BOOLEAN DEFAULT false,
  is_sharing_screen BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Cinema room messages
CREATE TABLE public.cinema_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.cinema_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  discord_username TEXT,
  discord_avatar TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one user per room at a time
ALTER TABLE public.cinema_room_members ADD CONSTRAINT unique_user_per_room UNIQUE (room_id, user_id);

-- Enable RLS
ALTER TABLE public.cinema_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_room_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone authenticated can read rooms
CREATE POLICY "Anyone can view active rooms" ON public.cinema_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can create rooms" ON public.cinema_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update own room" ON public.cinema_rooms FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete own room" ON public.cinema_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS: Members
CREATE POLICY "Anyone can view room members" ON public.cinema_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join rooms" ON public.cinema_room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.cinema_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.cinema_room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS: Messages
CREATE POLICY "Room members can view messages" ON public.cinema_room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can send messages" ON public.cinema_room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cinema_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cinema_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cinema_room_messages;
