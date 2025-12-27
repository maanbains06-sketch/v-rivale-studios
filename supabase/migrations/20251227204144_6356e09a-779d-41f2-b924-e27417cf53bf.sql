-- Add category column to giveaways table (all, whitelisted)
ALTER TABLE public.giveaways 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'all' CHECK (category IN ('all', 'whitelisted'));

-- Add discord_id column to giveaway_entries to store the Discord ID for verification
ALTER TABLE public.giveaway_entries 
ADD COLUMN IF NOT EXISTS discord_id TEXT;