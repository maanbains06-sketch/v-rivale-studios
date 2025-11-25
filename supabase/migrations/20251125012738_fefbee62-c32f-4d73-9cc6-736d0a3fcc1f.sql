-- Add tags and search to support_chats
ALTER TABLE support_chats ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE support_chats ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE support_chats ADD COLUMN sla_response_target TIMESTAMP WITH TIME ZONE;
ALTER TABLE support_chats ADD COLUMN sla_resolution_target TIMESTAMP WITH TIME ZONE;
ALTER TABLE support_chats ADD COLUMN first_response_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE support_chats ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE support_chats ADD COLUMN sla_breached BOOLEAN DEFAULT false;
ALTER TABLE support_chats ADD COLUMN escalated BOOLEAN DEFAULT false;
ALTER TABLE support_chats ADD COLUMN escalated_at TIMESTAMP WITH TIME ZONE;

-- Create knowledge base articles table
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  source_chat_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on knowledge_articles
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can view published articles
CREATE POLICY "Anyone can view published articles"
  ON knowledge_articles FOR SELECT
  USING (is_published = true);

-- Staff can view all articles
CREATE POLICY "Staff can view all articles"
  ON knowledge_articles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Staff can create articles
CREATE POLICY "Staff can create articles"
  ON knowledge_articles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Staff can update articles
CREATE POLICY "Staff can update articles"
  ON knowledge_articles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Staff can delete articles
CREATE POLICY "Staff can delete articles"
  ON knowledge_articles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create staff workload tracking table
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_available BOOLEAN DEFAULT true,
  current_workload INTEGER DEFAULT 0,
  max_concurrent_chats INTEGER DEFAULT 5,
  last_assignment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on staff_availability
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

-- Staff can view all availability
CREATE POLICY "Staff can view availability"
  ON staff_availability FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Staff can manage own availability
CREATE POLICY "Staff can update own availability"
  ON staff_availability FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all availability
CREATE POLICY "Admins can manage availability"
  ON staff_availability FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create SLA configuration table
CREATE TABLE sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority TEXT NOT NULL UNIQUE CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  response_time_minutes INTEGER NOT NULL,
  resolution_time_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default SLA configurations
INSERT INTO sla_config (priority, response_time_minutes, resolution_time_minutes) VALUES
  ('low', 1440, 10080),      -- 24 hours response, 7 days resolution
  ('normal', 480, 2880),      -- 8 hours response, 2 days resolution
  ('high', 120, 720),         -- 2 hours response, 12 hours resolution
  ('urgent', 30, 240);        -- 30 minutes response, 4 hours resolution

-- Enable RLS on sla_config
ALTER TABLE sla_config ENABLE ROW LEVEL SECURITY;

-- Anyone can view SLA config
CREATE POLICY "Anyone can view SLA config"
  ON sla_config FOR SELECT
  USING (true);

-- Only admins can modify SLA config
CREATE POLICY "Admins can modify SLA config"
  ON sla_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_support_chats_tags ON support_chats USING GIN(tags);
CREATE INDEX idx_support_chats_priority ON support_chats(priority);
CREATE INDEX idx_support_chats_sla_breached ON support_chats(sla_breached) WHERE sla_breached = true;
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX idx_knowledge_articles_published ON knowledge_articles(is_published) WHERE is_published = true;
CREATE INDEX idx_staff_availability_available ON staff_availability(is_available) WHERE is_available = true;

-- Function to auto-assign chat to available staff
CREATE OR REPLACE FUNCTION assign_chat_to_staff(chat_id UUID)
RETURNS UUID AS $$
DECLARE
  assigned_staff_id UUID;
BEGIN
  -- Find staff with lowest workload who is available
  SELECT user_id INTO assigned_staff_id
  FROM staff_availability
  WHERE is_available = true 
    AND current_workload < max_concurrent_chats
  ORDER BY current_workload ASC, last_assignment_at ASC NULLS FIRST
  LIMIT 1;
  
  IF assigned_staff_id IS NOT NULL THEN
    -- Update chat assignment
    UPDATE support_chats
    SET assigned_to = assigned_staff_id
    WHERE id = chat_id;
    
    -- Update staff workload
    UPDATE staff_availability
    SET current_workload = current_workload + 1,
        last_assignment_at = now()
    WHERE user_id = assigned_staff_id;
  END IF;
  
  RETURN assigned_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set SLA targets when chat is created
CREATE OR REPLACE FUNCTION set_sla_targets()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
BEGIN
  -- Get SLA config for the priority
  SELECT response_time_minutes, resolution_time_minutes
  INTO config_record
  FROM sla_config
  WHERE priority = NEW.priority;
  
  IF config_record IS NOT NULL THEN
    NEW.sla_response_target := NEW.created_at + (config_record.response_time_minutes || ' minutes')::INTERVAL;
    NEW.sla_resolution_target := NEW.created_at + (config_record.resolution_time_minutes || ' minutes')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set SLA targets on chat creation
CREATE TRIGGER set_chat_sla_targets
  BEFORE INSERT ON support_chats
  FOR EACH ROW
  EXECUTE FUNCTION set_sla_targets();

-- Function to check and mark SLA breaches
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS void AS $$
BEGIN
  -- Mark chats with breached response SLA
  UPDATE support_chats
  SET sla_breached = true
  WHERE first_response_at IS NULL
    AND sla_response_target < now()
    AND status != 'closed'
    AND sla_breached = false;
  
  -- Mark chats with breached resolution SLA
  UPDATE support_chats
  SET sla_breached = true
  WHERE resolved_at IS NULL
    AND sla_resolution_target < now()
    AND status != 'closed'
    AND sla_breached = false;
    
  -- Auto-escalate high priority breached chats
  UPDATE support_chats
  SET escalated = true,
      escalated_at = now(),
      priority = 'urgent'
  WHERE sla_breached = true
    AND escalated = false
    AND priority IN ('high', 'normal')
    AND status != 'closed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for updated_at
CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at
  BEFORE UPDATE ON staff_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_config_updated_at
  BEFORE UPDATE ON sla_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();