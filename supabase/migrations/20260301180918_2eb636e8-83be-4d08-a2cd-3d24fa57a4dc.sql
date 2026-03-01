
-- Insert application toggle settings into site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('app_toggle_whitelist', 'true'),
  ('app_toggle_staff', 'true'),
  ('app_toggle_police', 'true'),
  ('app_toggle_ems', 'true'),
  ('app_toggle_mechanic', 'true'),
  ('app_toggle_firefighter', 'true'),
  ('app_toggle_weazel_news', 'true'),
  ('app_toggle_pdm', 'true'),
  ('app_toggle_doj', 'true'),
  ('app_toggle_state_department', 'true'),
  ('app_toggle_gang', 'true'),
  ('app_toggle_business', 'true'),
  ('app_toggle_business_job', 'true'),
  ('app_toggle_creator', 'true'),
  ('app_toggle_ban_appeal', 'true')
ON CONFLICT (key) DO NOTHING;
