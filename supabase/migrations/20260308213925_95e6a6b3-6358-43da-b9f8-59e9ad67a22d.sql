
-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discord_username TEXT,
  discord_id TEXT,
  discord_avatar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own suggestions
CREATE POLICY "Users can insert own suggestions" ON public.suggestions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions" ON public.suggestions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_panel_access(auth.uid(), 'admin'));

-- Staff/admin can update suggestions
CREATE POLICY "Staff can update suggestions" ON public.suggestions
  FOR UPDATE TO authenticated
  USING (public.has_panel_access(auth.uid(), 'admin'));

-- Staff/admin can delete suggestions
CREATE POLICY "Staff can delete suggestions" ON public.suggestions
  FOR DELETE TO authenticated
  USING (public.has_panel_access(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;
