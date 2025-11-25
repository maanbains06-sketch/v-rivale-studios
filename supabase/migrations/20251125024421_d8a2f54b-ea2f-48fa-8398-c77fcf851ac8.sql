-- Create events table for gallery events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'community',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'running', 'completed', 'cancelled')),
  location TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  banner_image TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view non-cancelled events"
ON public.events FOR SELECT
USING (status != 'cancelled');

CREATE POLICY "Staff can create events"
ON public.events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Staff can update events"
ON public.events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Staff can delete events"
ON public.events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for event participants
CREATE POLICY "Anyone can view event participants"
ON public.event_participants FOR SELECT
USING (true);

CREATE POLICY "Users can register for events"
ON public.event_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration"
ON public.event_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registration"
ON public.event_participants FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update event status based on dates
CREATE OR REPLACE FUNCTION public.update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date <= now() AND NEW.end_date >= now() THEN
    NEW.status = 'running';
  ELSIF NEW.end_date < now() THEN
    NEW.status = 'completed';
  ELSIF NEW.start_date > now() THEN
    NEW.status = 'upcoming';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_event_status_on_insert
BEFORE INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_event_status();

CREATE TRIGGER check_event_status_on_update
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_event_status();