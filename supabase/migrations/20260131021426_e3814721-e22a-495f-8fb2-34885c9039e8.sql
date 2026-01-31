-- Create support_tickets table for formal ticket system
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('TKT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT,
  discord_username TEXT,
  steam_id TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.is_owner(auth.uid()));

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update tickets"
ON public.support_tickets
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.is_owner(auth.uid()) OR auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for support_tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- Add staff_report category to support_chats if not exists
-- This is handled in code via the category selector