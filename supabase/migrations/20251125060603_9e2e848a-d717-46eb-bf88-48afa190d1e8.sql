-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Unschedule any existing cron jobs with the same name
SELECT cron.unschedule('check-sla-breaches-direct') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-sla-breaches-direct'
);

-- Schedule SLA check to run every 5 minutes using pg_cron
SELECT cron.schedule(
  'check-sla-breaches-direct',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT check_sla_breach()'
);