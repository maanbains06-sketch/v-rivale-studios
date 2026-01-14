-- Function to handle new user signup - auto-create user_roles entry with 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a default 'user' role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger to auto-create user role on signup
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Function to update profile with Discord info from auth metadata
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discord_id TEXT;
  display_name TEXT;
  username TEXT;
BEGIN
  -- Extract discord_id and username from raw_user_meta_data
  discord_id := NEW.raw_user_meta_data->>'discord_id';
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username');
  username := NEW.raw_user_meta_data->>'username';
  
  -- Upsert into profiles table
  INSERT INTO public.profiles (id, discord_username)
  VALUES (NEW.id, COALESCE(display_name, username))
  ON CONFLICT (id) DO UPDATE
  SET discord_username = COALESCE(EXCLUDED.discord_username, profiles.discord_username),
      updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create trigger to sync profile on user creation
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_auth_metadata();

-- Also run for updates to sync when metadata changes
DROP TRIGGER IF EXISTS on_auth_user_updated_profile ON auth.users;

CREATE TRIGGER on_auth_user_updated_profile
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_auth_metadata();

-- Add discord_id column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'discord_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN discord_id TEXT;
  END IF;
END $$;

-- Add discord_avatar and discord_banner columns if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'discord_avatar'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN discord_avatar TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'discord_banner'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN discord_banner TEXT;
  END IF;
END $$;

-- Update the sync function to include discord_id and avatar
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discord_id TEXT;
  v_display_name TEXT;
  v_username TEXT;
  v_avatar TEXT;
  v_banner TEXT;
BEGIN
  -- Extract data from raw_user_meta_data
  v_discord_id := NEW.raw_user_meta_data->>'discord_id';
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username');
  v_username := NEW.raw_user_meta_data->>'username';
  v_avatar := NEW.raw_user_meta_data->>'discord_avatar';
  v_banner := NEW.raw_user_meta_data->>'discord_banner';
  
  -- Upsert into profiles table
  INSERT INTO public.profiles (id, discord_username, discord_id, discord_avatar, discord_banner)
  VALUES (NEW.id, COALESCE(v_display_name, v_username), v_discord_id, v_avatar, v_banner)
  ON CONFLICT (id) DO UPDATE
  SET discord_username = COALESCE(EXCLUDED.discord_username, profiles.discord_username),
      discord_id = COALESCE(EXCLUDED.discord_id, profiles.discord_id),
      discord_avatar = COALESCE(EXCLUDED.discord_avatar, profiles.discord_avatar),
      discord_banner = COALESCE(EXCLUDED.discord_banner, profiles.discord_banner),
      updated_at = now();
  
  RETURN NEW;
END;
$$;