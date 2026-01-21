-- Add 'closed' and 'on_hold' values to the application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'closed';