-- Drop the existing function first to change return type
DROP FUNCTION IF EXISTS public.sync_all_staff_user_ids();

-- Update link_staff_member_on_signup to use discord_id instead of discord_username
CREATE OR REPLACE FUNCTION public.link_staff_member_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  staff_record RECORD;
  assigned_role app_role;
  user_discord_id TEXT;
BEGIN
  -- Get discord_id from user metadata (stored during signup)
  user_discord_id := NEW.raw_user_meta_data->>'discord_id';
  
  IF user_discord_id IS NULL OR user_discord_id = '' THEN
    RETURN NEW;
  END IF;

  -- Find matching staff member by discord_id (exact match)
  SELECT * INTO staff_record
  FROM staff_members
  WHERE discord_id = user_discord_id
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
      WHEN staff_rec.role_type IN ('moderator', 'developer') THEN 'moderator'::app_role
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
    
    RAISE NOTICE 'Linked staff member % to user % with role %', staff_record.name, NEW.id, assigned_role;
  END IF;

  RETURN NEW;
END;
$function$;

-- Update auto_link_new_staff_member to use discord_id as well
CREATE OR REPLACE FUNCTION public.auto_link_new_staff_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_rec RECORD;
BEGIN
  -- Only run if user_id is not already set and discord_id exists
  IF NEW.user_id IS NOT NULL OR NEW.discord_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Try to find matching user by discord_id in their metadata
  SELECT u.id, u.email INTO user_rec
  FROM auth.users u
  WHERE (u.raw_user_meta_data->>'discord_id') = NEW.discord_id
  LIMIT 1;

  IF user_rec.id IS NOT NULL THEN
    NEW.user_id := user_rec.id;
    NEW.email := user_rec.email;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate sync_all_staff_user_ids with correct return type
CREATE OR REPLACE FUNCTION public.sync_all_staff_user_ids()
 RETURNS TABLE(staff_name text, staff_discord_id text, linked boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    staff_discord_id := staff_rec.discord_id;
    linked := false;
    message := 'No matching user found';

    IF staff_rec.discord_id IS NOT NULL THEN
      SELECT u.id, u.email INTO user_rec
      FROM auth.users u
      WHERE (u.raw_user_meta_data->>'discord_id') = staff_rec.discord_id
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
      message := 'No discord_id set';
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$function$;