-- Create storage bucket for Discord assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('discord-assets', 'discord-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public read access for discord assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'discord-assets');

-- Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload discord assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'discord-assets' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update discord assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'discord-assets' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete discord assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'discord-assets' AND auth.role() = 'authenticated');