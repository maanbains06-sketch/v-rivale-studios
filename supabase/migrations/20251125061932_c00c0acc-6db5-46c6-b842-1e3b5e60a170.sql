-- Update the new chat notification trigger to also auto-assign
CREATE OR REPLACE FUNCTION notify_staff_new_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_record RECORD;
  assigned_staff_id UUID;
BEGIN
  -- Try to auto-assign the chat immediately
  assigned_staff_id := assign_chat_to_staff(NEW.id);
  
  -- If auto-assigned, notify only the assigned staff
  IF assigned_staff_id IS NOT NULL THEN
    -- Already notified in assign_chat_to_staff function
    RETURN NEW;
  END IF;
  
  -- If no staff available for auto-assignment, notify all available staff
  FOR staff_record IN 
    SELECT sm.user_id, sm.name
    FROM staff_members sm
    JOIN staff_availability sa ON sm.user_id = sa.user_id
    WHERE sm.is_active = true 
      AND sm.user_id IS NOT NULL
      AND sa.is_available = true
      AND (sm.role_type IN ('admin', 'moderator', 'owner', 'developer'))
  LOOP
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      reference_id
    ) VALUES (
      staff_record.user_id,
      'New Unassigned Support Chat',
      'A new support chat needs attention: "' || NEW.subject || '". Priority: ' || COALESCE(NEW.priority, 'normal'),
      'support_chats',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;