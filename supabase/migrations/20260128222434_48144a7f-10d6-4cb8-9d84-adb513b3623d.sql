-- Add active_theme setting to site_settings if it doesn't exist
INSERT INTO public.site_settings (key, value, description)
VALUES ('active_theme', 'default', 'Currently active website theme (default, diwali, holi, halloween, winter, christmas, new_year, birthday)')
ON CONFLICT (key) DO NOTHING;