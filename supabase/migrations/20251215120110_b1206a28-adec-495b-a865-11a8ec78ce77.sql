-- Add new columns to creator_applications table
ALTER TABLE public.creator_applications
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS comply_with_policies BOOLEAN,
ADD COLUMN IF NOT EXISTS average_ccv TEXT,
ADD COLUMN IF NOT EXISTS expected_benefits TEXT,
ADD COLUMN IF NOT EXISTS value_contribution TEXT,
ADD COLUMN IF NOT EXISTS storyline_ideas TEXT;