-- Function to notify staff about new support chats
CREATE OR REPLACE FUNCTION notify_staff_new_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_record RECORD;
BEGIN
  -- Notify all available staff members
  FOR staff_record IN 
    SELECT sm.user_id, sm.name
    FROM staff_members sm
    JOIN staff_availability sa ON sm.user_id = sa.user_id
    WHERE sm.is_active = true 
      AND sa.is_available = true
      AND (sm.role_type = 'admin' OR sm.role_type = 'moderator')
  LOOP
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      reference_id
    ) VALUES (
      staff_record.user_id,
      'New Support Chat',
      'A new support chat has been created: "' || NEW.subject || '". Priority: ' || COALESCE(NEW.priority, 'normal'),
      'support_chats',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function to notify staff about SLA breaches
CREATE OR REPLACE FUNCTION notify_staff_sla_breach()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chat_record RECORD;
  staff_record RECORD;
BEGIN
  -- Find chats that have breached SLA and haven't been notified yet
  FOR chat_record IN 
    SELECT id, subject, priority, assigned_to, created_at, sla_response_target, sla_resolution_target
    FROM support_chats
    WHERE sla_breached = true 
      AND status != 'closed'
      AND NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE reference_id = support_chats.id 
          AND type = 'sla_breach'
          AND created_at > NOW() - INTERVAL '1 hour'
      )
  LOOP
    -- Notify assigned staff member if exists
    IF chat_record.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_id
      ) VALUES (
        chat_record.assigned_to,
        'SLA Breach Alert',
        'Support chat "' || chat_record.subject || '" has breached SLA targets. Priority: ' || COALESCE(chat_record.priority, 'normal'),
        'sla_breach',
        chat_record.id
      );
    ELSE
      -- Notify all available staff if no one is assigned
      FOR staff_record IN 
        SELECT sm.user_id
        FROM staff_members sm
        JOIN staff_availability sa ON sm.user_id = sa.user_id
        WHERE sm.is_active = true 
          AND sa.is_available = true
          AND (sm.role_type = 'admin' OR sm.role_type = 'moderator')
      LOOP
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          reference_id
        ) VALUES (
          staff_record.user_id,
          'Unassigned Chat SLA Breach',
          'Unassigned support chat "' || chat_record.subject || '" has breached SLA targets. Priority: ' || COALESCE(chat_record.priority, 'normal'),
          'sla_breach',
          chat_record.id
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- Trigger for new support chats
DROP TRIGGER IF EXISTS notify_staff_on_new_chat ON support_chats;
CREATE TRIGGER notify_staff_on_new_chat
  AFTER INSERT ON support_chats
  FOR EACH ROW
  EXECUTE FUNCTION notify_staff_new_chat();

-- Update the check_sla_breach function to also send notifications
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark chats as breached
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
  
  -- Send notifications about breaches
  PERFORM notify_staff_sla_breach();
END;
$$;