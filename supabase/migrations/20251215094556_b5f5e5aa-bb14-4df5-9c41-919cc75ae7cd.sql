-- Add column for ownership proof file
ALTER TABLE public.creator_applications 
ADD COLUMN ownership_proof_url TEXT;

-- Create storage bucket for creator proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-proofs', 'creator-proofs', false);

-- Allow anyone to upload to creator-proofs bucket (for unauthenticated submissions)
CREATE POLICY "Anyone can upload creator proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-proofs');

-- Allow admins to view creator proofs
CREATE POLICY "Admins can view creator proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'creator-proofs' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  )
);

-- Allow authenticated users to view their own uploads
CREATE POLICY "Users can view own creator proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'creator-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);