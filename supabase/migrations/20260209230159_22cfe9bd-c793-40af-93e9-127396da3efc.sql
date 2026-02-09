
-- Add attachment column to confidential_tickets
ALTER TABLE public.confidential_tickets 
ADD COLUMN attachment_url TEXT NULL;

-- Create storage bucket for confidential attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('confidential-attachments', 'confidential-attachments', false);

-- Users can upload their own attachments
CREATE POLICY "Users can upload confidential attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'confidential-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own attachments
CREATE POLICY "Users can view own confidential attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'confidential-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Staff/Owner can view all confidential attachments
CREATE POLICY "Staff can view all confidential attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'confidential-attachments' 
  AND (
    is_owner(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM staff_members 
      WHERE staff_members.discord_id = (
        SELECT users.raw_user_meta_data->>'discord_id' 
        FROM auth.users 
        WHERE users.id = auth.uid()
      ) AND staff_members.is_active = true
    )
  )
);
