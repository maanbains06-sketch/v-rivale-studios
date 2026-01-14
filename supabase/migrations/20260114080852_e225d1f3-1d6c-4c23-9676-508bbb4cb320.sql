-- Drop the existing function with different signature
DROP FUNCTION IF EXISTS public.auto_assign_unassigned_chats();

-- 1. Create or replace trigger function to link staff_members.user_id when users sign up with matching Discord ID
CREATE OR REPLACE FUNCTION public.link_staff_member_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discord_id_from_meta TEXT;
BEGIN
  -- Get Discord ID from user metadata
  discord_id_from_meta := NEW.raw_user_meta_data->>'discord_id';
  
  -- If user has a Discord ID in metadata, try to link to staff_members
  IF discord_id_from_meta IS NOT NULL AND discord_id_from_meta ~ '^\d{17,19}$' THEN
    UPDATE staff_members
    SET user_id = NEW.id,
        updated_at = now()
    WHERE discord_id = discord_id_from_meta
      AND user_id IS NULL;
    
    IF FOUND THEN
      RAISE LOG 'Linked staff member with discord_id % to user_id %', discord_id_from_meta, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_link_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_link_staff
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_staff_member_on_signup();

-- 2. Create function to get online staff for chat assignment based on discord_presence
CREATE OR REPLACE FUNCTION public.get_online_staff_for_chat_assignment()
RETURNS TABLE(staff_user_id uuid, staff_member_id uuid, current_workload int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.user_id as staff_user_id,
    sm.id as staff_member_id,
    COALESCE(
      (SELECT COUNT(*)::int FROM support_chats sc 
       WHERE sc.assigned_to = sm.user_id 
       AND sc.status IN ('open', 'in_progress')),
      0
    ) as current_workload
  FROM staff_members sm
  INNER JOIN discord_presence dp ON dp.staff_member_id = sm.id
  WHERE sm.is_active = true
    AND sm.user_id IS NOT NULL
    AND dp.is_online = true
    AND dp.status IN ('online', 'idle')
    AND dp.updated_at > now() - interval '15 minutes' -- Only consider recent presence
  ORDER BY current_workload ASC, dp.updated_at DESC;
END;
$$;

-- 3. Create improved auto-assign function that uses discord_presence for online status
CREATE OR REPLACE FUNCTION public.auto_assign_chat_to_online_staff(chat_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_user_id uuid;
  staff_record RECORD;
BEGIN
  -- Find the best available online staff member
  SELECT * INTO staff_record
  FROM get_online_staff_for_chat_assignment()
  WHERE current_workload < 5 -- Max 5 concurrent chats per staff
  LIMIT 1;
  
  IF staff_record.staff_user_id IS NOT NULL THEN
    -- Assign the chat
    UPDATE support_chats
    SET assigned_to = staff_record.staff_user_id,
        status = 'in_progress',
        updated_at = now()
    WHERE id = chat_id
      AND assigned_to IS NULL;
    
    IF FOUND THEN
      assigned_user_id := staff_record.staff_user_id;
      RAISE LOG 'Auto-assigned chat % to staff user %', chat_id, assigned_user_id;
    END IF;
  END IF;
  
  RETURN assigned_user_id;
END;
$$;

-- 4. Create trigger to auto-assign chats when created (if staff is online)
CREATE OR REPLACE FUNCTION public.auto_assign_new_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_to_user uuid;
BEGIN
  -- Only auto-assign if the chat is new and unassigned
  IF NEW.assigned_to IS NULL AND NEW.status = 'open' THEN
    assigned_to_user := public.auto_assign_chat_to_online_staff(NEW.id);
    
    IF assigned_to_user IS NOT NULL THEN
      NEW.assigned_to := assigned_to_user;
      NEW.status := 'in_progress';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS auto_assign_chat_on_insert ON support_chats;
CREATE TRIGGER auto_assign_chat_on_insert
  BEFORE INSERT ON support_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_new_chat();

-- 5. Create function to rebalance chats among online staff
CREATE OR REPLACE FUNCTION public.rebalance_chats_to_online_staff()
RETURNS TABLE(chat_id uuid, new_assigned_to uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unassigned_chat RECORD;
  staff_record RECORD;
BEGIN
  -- Find all unassigned open chats
  FOR unassigned_chat IN
    SELECT id FROM support_chats
    WHERE assigned_to IS NULL
      AND status IN ('open', 'pending')
    ORDER BY created_at ASC
  LOOP
    -- Find available online staff
    SELECT * INTO staff_record
    FROM get_online_staff_for_chat_assignment()
    WHERE current_workload < 5
    LIMIT 1;
    
    IF staff_record.staff_user_id IS NOT NULL THEN
      -- Assign the chat
      UPDATE support_chats
      SET assigned_to = staff_record.staff_user_id,
          status = 'in_progress',
          updated_at = now()
      WHERE id = unassigned_chat.id;
      
      chat_id := unassigned_chat.id;
      new_assigned_to := staff_record.staff_user_id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 6. Recreate auto_assign_unassigned_chats to use discord_presence
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
    -- Find available online staff using discord_presence
    SELECT * INTO staff_record
    FROM get_online_staff_for_chat_assignment()
    WHERE current_workload < 5
    LIMIT 1;

    IF staff_record.staff_user_id IS NOT NULL THEN
      -- Assign chat
      UPDATE support_chats 
      SET assigned_to = staff_record.staff_user_id,
          status = 'in_progress',
          updated_at = now()
      WHERE id = unassigned_chat.id;

      chat_id := unassigned_chat.id;
      assigned_to := staff_record.staff_user_id;
      subject := unassigned_chat.subject;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.link_staff_member_on_signup() TO postgres;
GRANT EXECUTE ON FUNCTION public.get_online_staff_for_chat_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_chat_to_online_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_new_chat() TO postgres;
GRANT EXECUTE ON FUNCTION public.rebalance_chats_to_online_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_unassigned_chats() TO authenticated;