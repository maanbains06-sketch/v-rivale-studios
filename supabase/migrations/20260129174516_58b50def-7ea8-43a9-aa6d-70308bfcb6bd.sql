-- Add live stream thumbnail and title columns to featured_youtubers
ALTER TABLE public.featured_youtubers
ADD COLUMN IF NOT EXISTS live_stream_title TEXT,
ADD COLUMN IF NOT EXISTS live_stream_thumbnail TEXT;