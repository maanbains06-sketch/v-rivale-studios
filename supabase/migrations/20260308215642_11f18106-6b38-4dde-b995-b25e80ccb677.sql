
-- Memorials table (only owner can insert/manage)
CREATE TABLE public.memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name TEXT NOT NULL,
  date_of_birth TEXT,
  date_of_death TEXT,
  eulogy TEXT,
  image_url TEXT,
  frame_style TEXT DEFAULT 'classic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Memorial comments (flowers/feelings from users)
CREATE TABLE public.memorial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  discord_username TEXT,
  discord_avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_comments ENABLE ROW LEVEL SECURITY;

-- Memorials: everyone can read, only owner can write
CREATE POLICY "Anyone can view memorials" ON public.memorials FOR SELECT USING (true);
CREATE POLICY "Owner can insert memorials" ON public.memorials FOR INSERT TO authenticated WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "Owner can update memorials" ON public.memorials FOR UPDATE TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "Owner can delete memorials" ON public.memorials FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- Memorial comments: authenticated can read and insert their own, owner can delete any
CREATE POLICY "Anyone can view memorial comments" ON public.memorial_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert comments" ON public.memorial_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.memorial_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.memorial_comments;

-- Create storage bucket for memorial images
INSERT INTO storage.buckets (id, name, public) VALUES ('memorial-images', 'memorial-images', true);

-- Storage policies for memorial images
CREATE POLICY "Anyone can view memorial images" ON storage.objects FOR SELECT USING (bucket_id = 'memorial-images');
CREATE POLICY "Owner can upload memorial images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memorial-images' AND public.is_owner(auth.uid()));
CREATE POLICY "Owner can delete memorial images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'memorial-images' AND public.is_owner(auth.uid()));
