-- Create table for managing panel access
CREATE TABLE public.panel_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id TEXT NOT NULL,
    discord_username TEXT,
    panel_type TEXT NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    UNIQUE(discord_id, panel_type)
);

-- Enable RLS
ALTER TABLE public.panel_access ENABLE ROW LEVEL SECURITY;

-- Only owner can view panel access
CREATE POLICY "Owner can view all panel access"
ON public.panel_access
FOR SELECT
TO authenticated
USING (public.is_owner(auth.uid()));

-- Only owner can insert panel access
CREATE POLICY "Owner can insert panel access"
ON public.panel_access
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

-- Only owner can update panel access
CREATE POLICY "Owner can update panel access"
ON public.panel_access
FOR UPDATE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Only owner can delete panel access
CREATE POLICY "Owner can delete panel access"
ON public.panel_access
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Create function to check if user has panel access
CREATE OR REPLACE FUNCTION public.has_panel_access(_user_id UUID, _panel_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _discord_id TEXT;
BEGIN
    -- Owner always has access
    IF public.is_owner(_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Get user's Discord ID from auth metadata
    SELECT COALESCE(
        raw_user_meta_data->>'discord_id',
        raw_user_meta_data->>'provider_id',
        raw_user_meta_data->>'sub'
    ) INTO _discord_id
    FROM auth.users
    WHERE id = _user_id;
    
    IF _discord_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has active access to the panel
    RETURN EXISTS (
        SELECT 1
        FROM public.panel_access
        WHERE discord_id = _discord_id
          AND panel_type = _panel_type
          AND is_active = true
    );
END;
$$;

-- Create index for faster lookups
CREATE INDEX idx_panel_access_discord_panel ON public.panel_access(discord_id, panel_type);
CREATE INDEX idx_panel_access_panel_type ON public.panel_access(panel_type);