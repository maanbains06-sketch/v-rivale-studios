-- Add channel_id column to featured_youtubers table for manual ownership verification
ALTER TABLE public.featured_youtubers 
ADD COLUMN IF NOT EXISTS channel_id TEXT;