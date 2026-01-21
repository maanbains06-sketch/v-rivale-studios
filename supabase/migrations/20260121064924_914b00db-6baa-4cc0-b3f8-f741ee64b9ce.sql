-- Recreate staff_members_public view to include discord_id for handler lookups
DROP VIEW IF EXISTS staff_members_public;

CREATE VIEW staff_members_public AS
SELECT 
    id,
    name,
    role,
    role_type,
    department,
    bio,
    responsibilities,
    discord_avatar,
    discord_username,
    discord_banner,
    discord_id,
    display_order,
    is_active,
    created_at,
    user_id
FROM staff_members;