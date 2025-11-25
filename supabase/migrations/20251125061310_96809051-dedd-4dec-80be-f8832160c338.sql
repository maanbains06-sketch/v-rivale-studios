-- Function to initialize staff member when they sign up
CREATE OR REPLACE FUNCTION link_staff_member_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_record RECORD;
  assigned_role app_role;
BEGIN
  -- Check if this user's email or discord matches a staff member
  SELECT * INTO staff_record
  FROM staff_members
  WHERE discord_username = NEW.raw_user_meta_data->>'discord_username'
    AND user_id IS NULL
  LIMIT 1;

  IF staff_record.id IS NOT NULL THEN
    -- Link the staff member to this user
    UPDATE staff_members
    SET user_id = NEW.id,
        email = NEW.email
    WHERE id = staff_record.id;

    -- Determine role based on role_type
    assigned_role := CASE 
      WHEN staff_record.role_type IN ('owner', 'admin') THEN 'admin'::app_role
      WHEN staff_record.role_type IN ('moderator', 'developer') THEN 'moderator'::app_role
      ELSE 'user'::app_role
    END;

    -- Assign the appropriate role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create staff availability record
    INSERT INTO staff_availability (
      user_id,
      is_available,
      current_workload,
      max_concurrent_chats
    ) VALUES (
      NEW.id,
      true,
      0,
      5
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Staff member % linked to user %', staff_record.name, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS link_staff_on_signup ON auth.users;

-- Create trigger to link staff members on signup
CREATE TRIGGER link_staff_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_staff_member_on_signup();

-- Function to manually link existing users to staff members by discord username
CREATE OR REPLACE FUNCTION manual_link_staff_members()
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

      -- Create availability
      INSERT INTO staff_availability (user_id, is_available, current_workload, max_concurrent_chats)
      VALUES (user_rec.id, true, 0, 5)
      ON CONFLICT (user_id) DO NOTHING;

      staff_name := staff_rec.name;
      user_email := user_rec.email;
      assigned_role := role_to_assign::text;
      RETURN NEXT;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

-- Update the notification trigger to handle staff without user_id
CREATE OR REPLACE FUNCTION notify_staff_new_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_record RECORD;
BEGIN
  -- Notify all available staff members who have user_id set
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
      'New Support Chat',
      'A new support chat has been created: "' || NEW.subject || '". Priority: ' || COALESCE(NEW.priority, 'normal'),
      'support_chats',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;