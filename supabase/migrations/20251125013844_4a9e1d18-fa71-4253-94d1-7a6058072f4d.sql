-- Fix search_path for auto_escalate_frustrated_chats function
CREATE OR REPLACE FUNCTION auto_escalate_frustrated_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If sentiment is frustrated or negative with low score, escalate
  IF (NEW.sentiment IN ('frustrated', 'negative') AND (NEW.sentiment_score IS NULL OR NEW.sentiment_score < -0.5)) 
     AND NEW.escalated = false THEN
    NEW.escalated = true;
    NEW.escalated_at = now();
    NEW.priority = 'high';
  END IF;
  
  RETURN NEW;
END;
$$;