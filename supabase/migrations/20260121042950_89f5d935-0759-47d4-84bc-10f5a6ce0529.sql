-- Add discord_id column to creator_applications if not exists
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- Add discord_id column to pdm_applications if not exists  
ALTER TABLE public.pdm_applications ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- Add discord_id column to weazel_news_applications if not exists
ALTER TABLE public.weazel_news_applications ADD COLUMN IF NOT EXISTS discord_id TEXT;