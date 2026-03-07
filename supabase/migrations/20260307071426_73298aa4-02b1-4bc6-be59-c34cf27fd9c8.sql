
-- Update has_panel_access to also grant access to active staff members (except owner panel)
CREATE OR REPLACE FUNCTION public.has_panel_access(_user_id uuid, _panel_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _discord_id TEXT;
BEGIN
    -- Owner always has access
    IF public.is_owner(_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Owner panel is restricted to owner only
    IF _panel_type = 'owner' THEN
        RETURN FALSE;
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
    
    -- Check if user has active access via panel_access table
    IF EXISTS (
        SELECT 1
        FROM public.panel_access
        WHERE discord_id = _discord_id
          AND panel_type = _panel_type
          AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- All active staff members get access to all panels (except owner, handled above)
    IF EXISTS (
        SELECT 1
        FROM public.staff_members
        WHERE (discord_id = _discord_id OR user_id = _user_id)
          AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$function$;

-- Remove duplicate RLS policy on staff_contracts
DROP POLICY IF EXISTS "Staff can sign own contracts" ON public.staff_contracts;

-- Keep only one clean policy for staff signing
DROP POLICY IF EXISTS "Staff can sign their own contracts" ON public.staff_contracts;
CREATE POLICY "Staff can sign their own contracts"
ON public.staff_contracts
FOR UPDATE
TO authenticated
USING (staff_discord_id = get_user_discord_id())
WITH CHECK (staff_discord_id = get_user_discord_id());
