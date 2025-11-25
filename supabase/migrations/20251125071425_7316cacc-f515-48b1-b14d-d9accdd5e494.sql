-- Create promo codes table for one-time use discount codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_percentage INTEGER NOT NULL DEFAULT 20,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view unused promo codes by code"
  ON public.promo_codes
  FOR SELECT
  USING (is_used = false OR auth.uid() = user_id OR auth.uid() = used_by);

CREATE POLICY "Users can view own promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert promo codes"
  ON public.promo_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update promo codes"
  ON public.promo_codes
  FOR UPDATE
  USING (true);

-- Function to generate unique promo code
CREATE OR REPLACE FUNCTION generate_promo_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := 'PROMO-' || upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM promo_codes WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create index for faster lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_user_id ON public.promo_codes(user_id);
CREATE INDEX idx_promo_codes_is_used ON public.promo_codes(is_used);