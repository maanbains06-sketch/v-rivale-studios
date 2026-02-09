
-- Add ticket_number column with auto-incrementing sequence
CREATE SEQUENCE IF NOT EXISTS confidential_ticket_number_seq START 1001;

ALTER TABLE public.confidential_tickets 
ADD COLUMN ticket_number TEXT UNIQUE DEFAULT 'CT-' || nextval('confidential_ticket_number_seq');

-- Backfill existing tickets
UPDATE public.confidential_tickets 
SET ticket_number = 'CT-' || nextval('confidential_ticket_number_seq')
WHERE ticket_number IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.confidential_tickets ALTER COLUMN ticket_number SET NOT NULL;
