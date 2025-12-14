-- First drop the existing trigger that's causing the dependency issue
DROP TRIGGER IF EXISTS link_staff_on_signup ON auth.users;
DROP TRIGGER IF EXISTS on_staff_member_signup ON auth.users;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS public.link_staff_member_on_signup() CASCADE;

-- Create improved function to link staff members on signup
CREATE OR REPLACE FUNCTION public.link_staff_member_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record RECORD;
  assigned_role app_role;
  user_discord_username TEXT;
BEGIN
  -- Get discord username from metadata
  user_discord_username := NEW.raw_user_meta_data->>'discord_username';
  
  IF user_discord_username IS NULL OR user_discord_username = '' THEN
    RETURN NEW;
  END IF;

  -- Find matching staff member by discord_username (case insensitive)
  SELECT * INTO staff_record
  FROM staff_members
  WHERE LOWER(discord_username) = LOWER(user_discord_username)
    AND user_id IS NULL
    AND is_active = true
  LIMIT 1;

  IF staff_record.id IS NOT NULL THEN
    -- Link the staff member to this user
    UPDATE staff_members
    SET user_id = NEW.id,
        email = NEW.email,
        updated_at = NOW()
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
    INSERT INTO staff_availability (user_id, is_available, current_workload, max_concurrent_chats)
    VALUES (NEW.id, true, 0, 5)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_staff_member_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_staff_member_on_signup();

-- Create function to auto-link when a new staff member is added
CREATE OR REPLACE FUNCTION public.auto_link_new_staff_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Only run if user_id is not already set and discord_username exists
  IF NEW.user_id IS NOT NULL OR NEW.discord_username IS NULL THEN
    RETURN NEW;
  END IF;

  -- Try to find matching user by discord_username
  SELECT u.id, u.email INTO user_rec
  FROM auth.users u
  WHERE LOWER(u.raw_user_meta_data->>'discord_username') = LOWER(NEW.discord_username)
  LIMIT 1;

  IF user_rec.id IS NOT NULL THEN
    NEW.user_id := user_rec.id;
    NEW.email := user_rec.email;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-linking new staff members
DROP TRIGGER IF EXISTS auto_link_staff_on_insert ON staff_members;
CREATE TRIGGER auto_link_staff_on_insert
  BEFORE INSERT ON staff_members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_new_staff_member();

-- Create AFTER trigger to assign roles when staff member gets user_id
CREATE OR REPLACE FUNCTION public.assign_staff_role_after_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if this is an update and user_id didn't change
  IF TG_OP = 'UPDATE' AND OLD.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  assigned_role := CASE 
    WHEN NEW.role_type IN ('owner', 'admin') THEN 'admin'::app_role
    WHEN NEW.role_type IN ('moderator', 'developer') THEN 'moderator'::app_role
    ELSE 'user'::app_role
  END;

  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.user_id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO staff_availability (user_id, is_available, current_workload, max_concurrent_chats)
  VALUES (NEW.user_id, true, 0, 5)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_role_after_staff_link ON staff_members;
CREATE TRIGGER assign_role_after_staff_link
  AFTER INSERT OR UPDATE ON staff_members
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_staff_role_after_link();

-- Create a manual sync function
CREATE OR REPLACE FUNCTION public.sync_all_staff_user_ids()
RETURNS TABLE(staff_name TEXT, discord_username TEXT, linked BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_rec RECORD;
  user_rec RECORD;
  assigned_role app_role;
BEGIN
  FOR staff_rec IN 
    SELECT * FROM staff_members 
    WHERE user_id IS NULL AND is_active = true
  LOOP
    staff_name := staff_rec.name;
    discord_username := staff_rec.discord_username;
    linked := false;
    message := 'No matching user found';

    IF staff_rec.discord_username IS NOT NULL THEN
      SELECT u.id, u.email INTO user_rec
      FROM auth.users u
      WHERE LOWER(u.raw_user_meta_data->>'discord_username') = LOWER(staff_rec.discord_username)
      LIMIT 1;

      IF user_rec.id IS NOT NULL THEN
        UPDATE staff_members
        SET user_id = user_rec.id, email = user_rec.email, updated_at = NOW()
        WHERE id = staff_rec.id;

        assigned_role := CASE 
          WHEN staff_rec.role_type IN ('owner', 'admin') THEN 'admin'::app_role
          WHEN staff_rec.role_type IN ('moderator', 'developer') THEN 'moderator'::app_role
          ELSE 'user'::app_role
        END;

        INSERT INTO user_roles (user_id, role)
        VALUES (user_rec.id, assigned_role)
        ON CONFLICT (user_id, role) DO NOTHING;

        INSERT INTO staff_availability (user_id, is_available, current_workload, max_concurrent_chats)
        VALUES (user_rec.id, true, 0, 5)
        ON CONFLICT (user_id) DO NOTHING;

        linked := true;
        message := 'Linked with role: ' || assigned_role::text;
      END IF;
    ELSE
      message := 'No discord_username set';
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$;