INSERT INTO public.site_settings (key, value, description)
VALUES ('time_clock_hidden', 'false', 'Hide Time Clock button from staff - owner only visibility')
ON CONFLICT (key) DO NOTHING;