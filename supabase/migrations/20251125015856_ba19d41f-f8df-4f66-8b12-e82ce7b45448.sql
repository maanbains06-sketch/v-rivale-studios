-- Create staff activity log table
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('chat_response', 'application_review', 'status_change', 'login', 'logout')),
  action_description TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add last_seen column to staff_members
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

-- Staff can view their own activity
CREATE POLICY "Staff can view own activity"
  ON public.staff_activity_log
  FOR SELECT
  USING (auth.uid() = staff_user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON public.staff_activity_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Service role can insert activity
CREATE POLICY "Service role can insert activity"
  ON public.staff_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Staff can insert their own activity
CREATE POLICY "Staff can insert own activity"
  ON public.staff_activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = staff_user_id);

-- Add indexes
CREATE INDEX idx_staff_activity_log_staff_user_id ON public.staff_activity_log(staff_user_id);
CREATE INDEX idx_staff_activity_log_created_at ON public.staff_activity_log(created_at DESC);
CREATE INDEX idx_staff_activity_log_action_type ON public.staff_activity_log(action_type);

-- Function to log staff activity
CREATE OR REPLACE FUNCTION public.log_staff_activity(
  p_staff_user_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.staff_activity_log (
    staff_user_id,
    action_type,
    action_description,
    related_id,
    related_type,
    metadata
  ) VALUES (
    p_staff_user_id,
    p_action_type,
    p_action_description,
    p_related_id,
    p_related_type,
    p_metadata
  )
  RETURNING id INTO v_activity_id;
  
  -- Update last_seen timestamp
  UPDATE public.staff_members
  SET last_seen = now()
  WHERE user_id = p_staff_user_id;
  
  RETURN v_activity_id;
END;
$$;