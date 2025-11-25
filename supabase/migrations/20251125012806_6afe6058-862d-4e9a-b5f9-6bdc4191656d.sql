-- Fix search path for security functions
DROP TRIGGER IF EXISTS set_chat_sla_targets ON support_chats;
DROP FUNCTION IF EXISTS set_sla_targets();
CREATE OR REPLACE FUNCTION set_sla_targets()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
BEGIN
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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_chat_sla_targets
  BEFORE INSERT ON support_chats
  FOR EACH ROW
  EXECUTE FUNCTION set_sla_targets();

DROP FUNCTION IF EXISTS assign_chat_to_staff(UUID);
CREATE OR REPLACE FUNCTION assign_chat_to_staff(chat_id UUID)
RETURNS UUID AS $$
DECLARE
  assigned_staff_id UUID;
BEGIN
  SELECT user_id INTO assigned_staff_id
  FROM staff_availability
  WHERE is_available = true 
    AND current_workload < max_concurrent_chats
  ORDER BY current_workload ASC, last_assignment_at ASC NULLS FIRST
  LIMIT 1;
  
  IF assigned_staff_id IS NOT NULL THEN
    UPDATE support_chats
    SET assigned_to = assigned_staff_id
    WHERE id = chat_id;
    
    UPDATE staff_availability
    SET current_workload = current_workload + 1,
        last_assignment_at = now()
    WHERE user_id = assigned_staff_id;
  END IF;
  
  RETURN assigned_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS check_sla_breach();
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS void AS $$
BEGIN
  UPDATE support_chats
  SET sla_breached = true
  WHERE first_response_at IS NULL
    AND sla_response_target < now()
    AND status != 'closed'
    AND sla_breached = false;
  
  UPDATE support_chats
  SET sla_breached = true
  WHERE resolved_at IS NULL
    AND sla_resolution_target < now()
    AND status != 'closed'
    AND sla_breached = false;
    
  UPDATE support_chats
  SET escalated = true,
      escalated_at = now(),
      priority = 'urgent'
  WHERE sla_breached = true
    AND escalated = false
    AND priority IN ('high', 'normal')
    AND status != 'closed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;