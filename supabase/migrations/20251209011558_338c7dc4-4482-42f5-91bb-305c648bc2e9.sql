-- Add open_positions setting
INSERT INTO site_settings (key, value, description)
VALUES ('open_positions', '7', 'Number of open staff positions')
ON CONFLICT (key) DO NOTHING;

-- Add staff_role_id for staff verification on Discord
INSERT INTO site_settings (key, value, description)
VALUES ('staff_discord_role_id', '', 'Discord role ID to verify staff members')
ON CONFLICT (key) DO NOTHING;

-- Add owner_discord_id for owner panel access verification
INSERT INTO site_settings (key, value, description)
VALUES ('owner_discord_id', '', 'Discord ID of the server owner for Owner Panel access')
ON CONFLICT (key) DO NOTHING;