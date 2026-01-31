-- Add player_id and player_name columns to support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS player_id TEXT,
ADD COLUMN IF NOT EXISTS player_name TEXT;