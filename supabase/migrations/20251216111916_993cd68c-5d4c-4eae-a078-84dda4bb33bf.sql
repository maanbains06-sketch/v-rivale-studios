-- Add discord_event_id column to track events from Discord
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS discord_event_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_discord_event_id ON public.events(discord_event_id);

-- Add source column to identify where event came from
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Update existing events to have 'manual' source
UPDATE public.events SET source = 'manual' WHERE source IS NULL;