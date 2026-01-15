-- Fix auto_assign_unassigned_chats function to work without requiring discord presence
-- Also assign to all available staff based on staff_availability table directly

CREATE OR REPLACE FUNCTION public.auto_assign_unassigned_chats()
RETURNS TABLE(chat_id uuid, assigned_to uuid, subject text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unassigned_chat RECORD;
  staff_record RECORD;
BEGIN
  FOR unassigned_chat IN
    SELECT sc.id, sc.subject
    FROM support_chats sc
    WHERE sc.assigned_to IS NULL
      AND sc.status IN ('open', 'pending')
    ORDER BY 
      CASE sc.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
        ELSE 5 
      END,
      sc.created_at ASC
  LOOP
    -- Find available staff member directly from staff_availability
    -- Don't require discord presence to be online
    SELECT 
      sa.user_id as staff_user_id,
      sa.current_workload
    INTO staff_record
    FROM staff_availability sa
    INNER JOIN staff_members sm ON sa.user_id = sm.user_id
    WHERE sa.is_available = true
      AND sm.is_active = true
      AND sm.user_id IS NOT NULL
      AND sa.current_workload < COALESCE(sa.max_concurrent_chats, 5)
    ORDER BY 
      sa.current_workload ASC, 
      sa.last_assignment_at ASC NULLS FIRST,
      random()
    LIMIT 1;

    IF staff_record.staff_user_id IS NOT NULL THEN
      -- Assign chat
      UPDATE support_chats 
      SET assigned_to = staff_record.staff_user_id,
          status = 'in_progress',
          updated_at = now()
      WHERE id = unassigned_chat.id;

      -- Update staff workload
      UPDATE staff_availability
      SET current_workload = current_workload + 1,
          last_assignment_at = now(),
          updated_at = now()
      WHERE user_id = staff_record.staff_user_id;

      -- Create notification for staff
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        reference_id
      ) VALUES (
        staff_record.staff_user_id,
        'Chat Assigned to You',
        'A support chat has been automatically assigned to you.',
        'support_chats',
        unassigned_chat.id
      );

      chat_id := unassigned_chat.id;
      assigned_to := staff_record.staff_user_id;
      subject := unassigned_chat.subject;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Add unique constraint on discord_id in profiles table to prevent duplicate signups
-- First, clean up any null values (they should not conflict)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_discord_id_unique;

-- Create a unique index that only applies to non-null discord_ids
CREATE UNIQUE INDEX IF NOT EXISTS profiles_discord_id_unique_idx 
ON public.profiles(discord_id) 
WHERE discord_id IS NOT NULL;