
-- Create confidential tickets table
CREATE TABLE public.confidential_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discord_id TEXT NOT NULL,
  discord_username TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- Enable RLS
ALTER TABLE public.confidential_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own confidential tickets"
ON public.confidential_tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tickets
CREATE POLICY "Users can create confidential tickets"
ON public.confidential_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owner and staff can view all confidential tickets
CREATE POLICY "Staff can view all confidential tickets"
ON public.confidential_tickets
FOR SELECT
USING (
  public.is_owner(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE discord_id = (SELECT raw_user_meta_data->>'discord_id' FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  )
);

-- Owner and staff can update confidential tickets
CREATE POLICY "Staff can update confidential tickets"
ON public.confidential_tickets
FOR UPDATE
USING (
  public.is_owner(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE discord_id = (SELECT raw_user_meta_data->>'discord_id' FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.confidential_tickets;

-- Trigger for updated_at
CREATE TRIGGER update_confidential_tickets_updated_at
BEFORE UPDATE ON public.confidential_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
