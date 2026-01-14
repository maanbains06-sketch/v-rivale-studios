-- Fix ambiguous user_id reference in assign_chat_to_staff function
CREATE OR REPLACE FUNCTION public.assign_chat_to_staff(chat_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT sa.user_id INTO assigned_staff_id
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
$function$;