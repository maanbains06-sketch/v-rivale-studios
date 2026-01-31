-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to ticket-attachments bucket
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Allow public read access to ticket attachments
CREATE POLICY "Public can view ticket attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ticket-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own ticket attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ticket-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add attachments column to support_tickets table
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';