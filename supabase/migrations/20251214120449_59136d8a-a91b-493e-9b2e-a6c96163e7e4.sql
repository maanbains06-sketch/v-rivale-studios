-- Enable realtime for discord_presence table
ALTER TABLE discord_presence REPLICA IDENTITY FULL;

-- Add the table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'discord_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE discord_presence;
  END IF;
END $$;