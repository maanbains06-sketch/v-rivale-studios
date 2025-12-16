-- Force update the event status
UPDATE public.events SET status = 'completed' WHERE id = '4b3858bf-92fc-4d28-9570-93b3592f1106';

-- Delete if still not working - clear all cancelled/deleted Discord events
DELETE FROM public.events WHERE source = 'discord' AND status IN ('upcoming', 'running');