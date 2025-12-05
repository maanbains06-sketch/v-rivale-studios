-- Drop the existing view and recreate with user_id for online status
DROP VIEW IF EXISTS staff_members_public;

CREATE VIEW staff_members_public AS
SELECT 
  id,
  name,
  role,
  role_type,
  department,
  bio,
  discord_avatar,
  responsibilities,
  is_active,
  display_order,
  user_id,
  created_at
FROM staff_members
WHERE is_active = true;