-- Enable realtime for staff_members table to auto-update UI when Discord profiles change
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_members;