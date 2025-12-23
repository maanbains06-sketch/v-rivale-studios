-- Fix security issues: Add authorization checks to SECURITY DEFINER functions
-- Drop all functions first to avoid signature conflicts

DROP FUNCTION IF EXISTS public.auto_assign_unassigned_chats();
DROP FUNCTION IF EXISTS public.rebalance_staff_workload();
DROP FUNCTION IF EXISTS public.manual_link_staff_members();

-- 1. Recreate manual_link_staff_members with authorization check
CREATE FUNCTION public.manual_link_staff_members()
RETURNS TABLE(staff_name text, user_email text, assigned_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_rec RECORD;
  user_rec RECORD;
  role_to_assign app_role;
BEGIN
  -- Authorization check: Only admin or owner can execute this function
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Insufficient permissions: admin or owner role required';
  END IF;

  -- Loop through all staff members without user_id
  FOR staff_rec IN 
    SELECT * FROM staff_members WHERE user_id IS NULL
  LOOP
    -- Try to find matching user by discord username in metadata
    FOR user_rec IN
      SELECT * FROM auth.users
      WHERE raw_user_meta_data->>'discord_username' = staff_rec.discord_username
    LOOP
      -- Link the staff member
      UPDATE staff_members
      SET user_id = user_rec.id,
          email = user_rec.email
      WHERE id = staff_rec.id;

      -- Determine and assign role
      role_to_assign := CASE 
        WHEN staff_rec.role_type IN ('owner', 'admin') THEN 'admin'::app_role
        WHEN staff_rec.role_type IN ('moderator', 'developer') THEN 'moderator'::app_role
        ELSE 'user'::app_role
      END;

      INSERT INTO user_roles (user_id, role)
      VALUES (user_rec.id, role_to_assign)
      ON CONFLICT (user_id, role) DO NOTHING;

      RETURN QUERY SELECT staff_rec.name::text, user_rec.email::text, role_to_assign::text;
    END LOOP;
  END LOOP;
END;
$$;

-- 2. Recreate auto_assign_unassigned_chats with authorization check (matching original return order)
CREATE FUNCTION public.auto_assign_unassigned_chats()
RETURNS TABLE(chat_id uuid, assigned_to uuid, chat_subject text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  unassigned_chat RECORD;
  assigned_staff_id uuid;
BEGIN
  -- Authorization check: Only admin, moderator, or owner can trigger auto-assignment
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) 
       OR public.has_role(auth.uid(), 'moderator'::app_role) 
       OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Insufficient permissions: admin, moderator, or owner role required';
  END IF;

  FOR unassigned_chat IN
    SELECT sc.id, sc.subject
    FROM support_chats sc
    WHERE sc.assigned_to IS NULL
      AND sc.status IN ('open', 'pending')
    ORDER BY sc.priority DESC NULLS LAST, sc.created_at ASC
  LOOP
    -- Find available staff
    SELECT sa.user_id INTO assigned_staff_id
    FROM staff_availability sa
    JOIN staff_members sm ON sa.user_id = sm.user_id
    WHERE sa.is_available = true
      AND sa.current_workload < sa.max_concurrent_chats
      AND sm.is_active = true
      AND sm.role_type IN ('admin', 'moderator', 'owner', 'support')
    ORDER BY sa.current_workload ASC, sa.last_assignment_at ASC NULLS FIRST
    LIMIT 1;

    IF assigned_staff_id IS NOT NULL THEN
      -- Assign chat
      UPDATE support_chats 
      SET assigned_to = assigned_staff_id,
          updated_at = now()
      WHERE id = unassigned_chat.id;

      -- Update workload
      UPDATE staff_availability
      SET current_workload = current_workload + 1,
          last_assignment_at = now(),
          updated_at = now()
      WHERE user_id = assigned_staff_id;

      RETURN QUERY SELECT unassigned_chat.id, assigned_staff_id, unassigned_chat.subject;
    END IF;
  END LOOP;
END;
$$;

-- 3. Recreate rebalance_staff_workload with authorization check
CREATE FUNCTION public.rebalance_staff_workload()
RETURNS TABLE(rebalanced_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  overloaded_staff RECORD;
  underloaded_staff RECORD;
  chat_to_reassign RECORD;
  reassign_count integer := 0;
BEGIN
  -- Authorization check: Only admin, moderator, or owner can rebalance workload
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) 
       OR public.has_role(auth.uid(), 'moderator'::app_role) 
       OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Insufficient permissions: admin, moderator, or owner role required';
  END IF;

  -- Find overloaded staff (workload > 80% capacity)
  FOR overloaded_staff IN
    SELECT sa.user_id, sa.current_workload, sa.max_concurrent_chats
    FROM staff_availability sa
    WHERE sa.is_available = true
      AND sa.current_workload > (sa.max_concurrent_chats * 0.8)
    ORDER BY sa.current_workload DESC
  LOOP
    -- Find underloaded staff to transfer to
    SELECT sa.user_id INTO underloaded_staff
    FROM staff_availability sa
    JOIN staff_members sm ON sa.user_id = sm.user_id
    WHERE sa.is_available = true
      AND sa.current_workload < (sa.max_concurrent_chats * 0.5)
      AND sa.user_id != overloaded_staff.user_id
      AND sm.is_active = true
    ORDER BY sa.current_workload ASC
    LIMIT 1;

    IF underloaded_staff IS NOT NULL THEN
      -- Get oldest chat from overloaded staff
      SELECT sc.id INTO chat_to_reassign
      FROM support_chats sc
      WHERE sc.assigned_to = overloaded_staff.user_id
        AND sc.status IN ('open', 'pending')
      ORDER BY sc.created_at ASC
      LIMIT 1;

      IF chat_to_reassign IS NOT NULL THEN
        -- Reassign chat
        UPDATE support_chats
        SET assigned_to = underloaded_staff.user_id,
            updated_at = now()
        WHERE id = chat_to_reassign.id;

        -- Update workloads
        UPDATE staff_availability
        SET current_workload = current_workload - 1,
            updated_at = now()
        WHERE user_id = overloaded_staff.user_id;

        UPDATE staff_availability
        SET current_workload = current_workload + 1,
            last_assignment_at = now(),
            updated_at = now()
        WHERE user_id = underloaded_staff.user_id;

        reassign_count := reassign_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT reassign_count, format('%s chats rebalanced', reassign_count);
END;
$$;

-- 4. Fix creator-proofs storage policy - Require authentication for uploads
DROP POLICY IF EXISTS "Anyone can upload creator proofs" ON storage.objects;

CREATE POLICY "Authenticated users can upload creator proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'creator-proofs' 
  AND auth.uid() IS NOT NULL
);