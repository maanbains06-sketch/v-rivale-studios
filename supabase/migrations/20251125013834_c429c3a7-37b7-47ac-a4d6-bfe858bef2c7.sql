-- Add sentiment tracking to support chats
ALTER TABLE support_chats 
ADD COLUMN sentiment text,
ADD COLUMN sentiment_score numeric;

-- Create index for filtering by sentiment
CREATE INDEX idx_support_chats_sentiment ON support_chats(sentiment);

-- Add comment for documentation
COMMENT ON COLUMN support_chats.sentiment IS 'Detected sentiment: positive, neutral, negative, frustrated';
COMMENT ON COLUMN support_chats.sentiment_score IS 'Sentiment score from -1 (very negative) to 1 (very positive)';

-- Create function to auto-escalate frustrated users
CREATE OR REPLACE FUNCTION auto_escalate_frustrated_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for auto-escalation
DROP TRIGGER IF EXISTS trigger_auto_escalate_frustrated ON support_chats;
CREATE TRIGGER trigger_auto_escalate_frustrated
  BEFORE UPDATE OF sentiment, sentiment_score ON support_chats
  FOR EACH ROW
  EXECUTE FUNCTION auto_escalate_frustrated_chats();