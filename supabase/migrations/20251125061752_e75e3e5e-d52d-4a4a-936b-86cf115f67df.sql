-- Enhanced function to automatically assign chats to staff based on workload
CREATE OR REPLACE FUNCTION assign_chat_to_staff(chat_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assigned_staff_id UUID;
  chat_priority TEXT;
BEGIN
  -- Get chat priority
  SELECT priority INTO chat_priority
  FROM support_chats
  WHERE id = chat_id;

  -- Find the best available staff member using a scoring system
  -- Factors: availability, current workload, last assignment time
  SELECT user_id INTO assigned_staff_id
  FROM staff_availability sa
  JOIN staff_members sm ON sa.user_id = sm.user_id
  WHERE sa.is_available = true 
    AND sm.is_active = true
    AND sa.current_workload < sa.max_concurrent_chats
    AND (sm.role_type IN ('admin', 'moderator', 'owner', 'developer'))
  ORDER BY 
    -- Prioritize staff with lower workload
    (sa.current_workload::float / sa.max_concurrent_chats::float) ASC,
    -- Then by those who haven't been assigned recently
    sa.last_assignment_at ASC NULLS FIRST,
    -- Random tiebreaker for fairness
    random()
  LIMIT 1;
  
  IF assigned_staff_id IS NOT NULL THEN
    -- Assign the chat
    UPDATE support_chats
    SET assigned_to = assigned_staff_id,
        status = 'in_progress'
    WHERE id = chat_id;
    
    -- Update staff workload
    UPDATE staff_availability
    SET current_workload = current_workload + 1,
        last_assignment_at = now(),
        updated_at = now()
    WHERE user_id = assigned_staff_id;
    
    -- Log the assignment
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      reference_id
    ) VALUES (
      assigned_staff_id,
      'Chat Assigned to You',
      'A support chat has been automatically assigned to you based on current workload distribution.',
      'support_chats',
      chat_id
    );
    
    RAISE NOTICE 'Chat % assigned to staff %', chat_id, assigned_staff_id;
  ELSE
    RAISE NOTICE 'No available staff members found for chat %', chat_id;
  END IF;
  
  RETURN assigned_staff_id;
END;
$$;

-- Function to redistribute workload when a chat is closed
CREATE OR REPLACE FUNCTION handle_chat_close()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If chat is being closed and was assigned, decrease staff workload
  IF NEW.status = 'closed' AND OLD.status != 'closed' AND OLD.assigned_to IS NOT NULL THEN
    UPDATE staff_availability
    SET current_workload = GREATEST(0, current_workload - 1),
        updated_at = now()
    WHERE user_id = OLD.assigned_to;
    
    RAISE NOTICE 'Decreased workload for staff % after closing chat %', OLD.assigned_to, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for chat closure
DROP TRIGGER IF EXISTS handle_chat_close_trigger ON support_chats;
CREATE TRIGGER handle_chat_close_trigger
  AFTER UPDATE ON support_chats
  FOR EACH ROW
  WHEN (NEW.status = 'closed' AND OLD.status != 'closed')
  EXECUTE FUNCTION handle_chat_close();

-- Function to auto-assign unassigned chats
CREATE OR REPLACE FUNCTION auto_assign_unassigned_chats()
RETURNS TABLE(chat_id uuid, assigned_to uuid, chat_subject text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chat_record RECORD;
  assigned_staff uuid;
BEGIN
  -- Find all unassigned open chats
  FOR chat_record IN 
    SELECT id, subject, priority, created_at
    FROM support_chats
    WHERE assigned_to IS NULL
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
      chat_id := chat_record.id;
      assigned_to := assigned_staff;
      chat_subject := chat_record.subject;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Function to rebalance workload (reassign chats if staff availability changes)
CREATE OR REPLACE FUNCTION rebalance_staff_workload()
RETURNS TABLE(rebalanced_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  overloaded_staff RECORD;
  available_staff RECORD;
  chat_to_reassign RECORD;
  reassign_count INTEGER := 0;
BEGIN
  -- Find staff members who are overloaded
  FOR overloaded_staff IN
    SELECT sa.user_id, sa.current_workload, sa.max_concurrent_chats, sm.name
    FROM staff_availability sa
    JOIN staff_members sm ON sa.user_id = sm.user_id
    WHERE sa.current_workload > sa.max_concurrent_chats * 0.8  -- 80% capacity
      AND sm.is_active = true
    ORDER BY (sa.current_workload::float / sa.max_concurrent_chats::float) DESC
  LOOP
    -- Find the least loaded available staff
    SELECT sa.user_id INTO available_staff
    FROM staff_availability sa
    JOIN staff_members sm ON sa.user_id = sm.user_id
    WHERE sa.is_available = true
      AND sm.is_active = true
      AND sa.current_workload < sa.max_concurrent_chats * 0.5  -- Under 50% capacity
      AND sa.user_id != overloaded_staff.user_id
    ORDER BY (sa.current_workload::float / sa.max_concurrent_chats::float) ASC
    LIMIT 1;
    
    -- If we found someone, reassign one of their chats
    IF available_staff.user_id IS NOT NULL THEN
      -- Get the oldest chat from the overloaded staff
      SELECT id, subject INTO chat_to_reassign
      FROM support_chats
      WHERE assigned_to = overloaded_staff.user_id
        AND status = 'in_progress'
      ORDER BY last_message_at ASC
      LIMIT 1;
      
      IF chat_to_reassign.id IS NOT NULL THEN
        -- Reassign the chat
        UPDATE support_chats
        SET assigned_to = available_staff.user_id
        WHERE id = chat_to_reassign.id;
        
        -- Update workloads
        UPDATE staff_availability
        SET current_workload = current_workload - 1
        WHERE user_id = overloaded_staff.user_id;
        
        UPDATE staff_availability
        SET current_workload = current_workload + 1,
            last_assignment_at = now()
        WHERE user_id = available_staff.user_id;
        
        -- Notify both staff members
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES 
          (available_staff.user_id, 'Chat Reassigned to You', 
           'A chat has been reassigned to you for workload balancing: "' || chat_to_reassign.subject || '"',
           'support_chats', chat_to_reassign.id),
          (overloaded_staff.user_id, 'Chat Reassigned', 
           'One of your chats has been reassigned to balance workload: "' || chat_to_reassign.subject || '"',
           'support_chats', chat_to_reassign.id);
        
        reassign_count := reassign_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  rebalanced_count := reassign_count;
  message := 'Rebalanced ' || reassign_count || ' chat(s)';
  RETURN NEXT;
END;
$$;