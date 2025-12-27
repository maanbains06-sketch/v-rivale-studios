-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron job if it exists (to avoid duplicates)
SELECT cron.unschedule('check-giveaway-status') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-giveaway-status'
);