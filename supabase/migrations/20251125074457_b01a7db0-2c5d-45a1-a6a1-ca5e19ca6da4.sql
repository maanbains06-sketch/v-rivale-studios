-- Fix ambiguous column reference in auto_assign_unassigned_chats function
CREATE OR REPLACE FUNCTION auto_assign_unassigned_chats()
RETURNS TABLE(chat_id uuid, assigned_to uuid, chat_subject text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chat_record RECORD;
  assigned_staff uuid;
  result_chat_id uuid;
  result_assigned_to uuid;
  result_chat_subject text;
BEGIN
  -- Find all unassigned open chats
  FOR chat_record IN 
    SELECT id, subject, priority, created_at
    FROM support_chats
    WHERE support_chats.assigned_to IS NULL
      AND status = 'open'
    ORDER BY 
      -- Prioritize by urgency
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 3
      END,
      created_at ASC
  LOOP
    -- Try to assign this chat
    assigned_staff := assign_chat_to_staff(chat_record.id);
    
    IF assigned_staff IS NOT NULL THEN
      result_chat_id := chat_record.id;
      result_assigned_to := assigned_staff;
      result_chat_subject := chat_record.subject;
      
      chat_id := result_chat_id;
      assigned_to := result_assigned_to;
      chat_subject := result_chat_subject;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;