-- =====================================================
-- OWNER 2FA AND AUDIT LOG SYSTEM
-- =====================================================

-- 1. CREATE OWNER AUDIT LOG TABLE
CREATE TABLE public.owner_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_description text NOT NULL,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_audit_log ENABLE ROW LEVEL SECURITY;

-- Only owner can view audit logs
CREATE POLICY "Only owner can view audit logs" 
ON public.owner_audit_log 
FOR SELECT 
USING (is_owner(auth.uid()));

-- Allow inserts for logging (service role or authenticated)
CREATE POLICY "Allow audit log inserts" 
ON public.owner_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. CREATE OWNER 2FA VERIFICATION TABLE
CREATE TABLE public.owner_2fa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean DEFAULT false,
  secret_key text,
  backup_codes text[],
  last_verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_2fa_sessions ENABLE ROW LEVEL SECURITY;

-- Only owner can manage their 2FA
CREATE POLICY "Owner can manage own 2FA" 
ON public.owner_2fa_sessions 
FOR ALL 
USING (is_owner(auth.uid()) AND auth.uid() = user_id)
WITH CHECK (is_owner(auth.uid()) AND auth.uid() = user_id);

-- 3. CREATE OWNER VERIFICATION TOKENS TABLE (for session-based 2FA)
CREATE TABLE public.owner_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Only the token owner can view/use their tokens
CREATE POLICY "Users can manage own verification tokens" 
ON public.owner_verification_tokens 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. CREATE FUNCTION TO LOG OWNER ACTIONS
CREATE OR REPLACE FUNCTION public.log_owner_action(
  p_action_type text,
  p_action_description text,
  p_target_table text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Only allow owner to log actions
  IF NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only owner can log actions';
  END IF;

  INSERT INTO public.owner_audit_log (
    owner_user_id,
    action_type,
    action_description,
    target_table,
    target_id,
    old_value,
    new_value
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_action_description,
    p_target_table,
    p_target_id,
    p_old_value,
    p_new_value
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 5. CREATE FUNCTION TO VERIFY OWNER 2FA
CREATE OR REPLACE FUNCTION public.verify_owner_2fa(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean := false;
BEGIN
  -- Check if token exists, is not used, and not expired
  SELECT true INTO v_valid
  FROM public.owner_verification_tokens
  WHERE user_id = auth.uid()
    AND token = p_token
    AND used = false
    AND expires_at > now();
  
  IF v_valid THEN
    -- Mark token as used
    UPDATE public.owner_verification_tokens
    SET used = true
    WHERE user_id = auth.uid() AND token = p_token;
    
    -- Update last verified timestamp
    UPDATE public.owner_2fa_sessions
    SET last_verified_at = now()
    WHERE user_id = auth.uid();
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 6. CREATE FUNCTION TO GENERATE 2FA TOKEN
CREATE OR REPLACE FUNCTION public.generate_owner_2fa_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  -- Only allow owner to generate tokens
  IF NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only owner can generate 2FA tokens';
  END IF;

  -- Generate a 6-digit numeric token
  v_token := lpad(floor(random() * 1000000)::text, 6, '0');
  
  -- Insert new token (expires in 10 minutes)
  INSERT INTO public.owner_verification_tokens (
    user_id,
    token,
    expires_at
  ) VALUES (
    auth.uid(),
    v_token,
    now() + interval '10 minutes'
  );
  
  RETURN v_token;
END;
$$;

-- 7. CREATE FUNCTION TO CHECK IF OWNER SESSION IS VERIFIED
CREATE OR REPLACE FUNCTION public.is_owner_session_verified()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_verified timestamp with time zone;
BEGIN
  IF NOT is_owner(auth.uid()) THEN
    RETURN false;
  END IF;

  SELECT last_verified_at INTO v_last_verified
  FROM public.owner_2fa_sessions
  WHERE user_id = auth.uid();
  
  -- Session is verified if verified within last 30 minutes
  IF v_last_verified IS NOT NULL AND v_last_verified > now() - interval '30 minutes' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;