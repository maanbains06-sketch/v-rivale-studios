-- Enable realtime for featured_youtubers table to allow live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_youtubers;