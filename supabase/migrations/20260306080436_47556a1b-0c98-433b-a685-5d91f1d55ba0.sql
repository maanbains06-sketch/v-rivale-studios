-- Create storage bucket for case evidence files (500MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('case-evidence', 'case-evidence', true, 524288000)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to case-evidence bucket
CREATE POLICY "Staff can upload case evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-evidence');

-- Allow authenticated users to read case evidence
CREATE POLICY "Anyone can view case evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-evidence');

-- Allow authenticated users to delete case evidence
CREATE POLICY "Staff can delete case evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-evidence');

-- Add file_size column to case_file_evidence if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_file_evidence' AND column_name = 'file_size') THEN
    ALTER TABLE public.case_file_evidence ADD COLUMN file_size bigint;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_file_suspect_evidence' AND column_name = 'file_size') THEN
    ALTER TABLE public.case_file_suspect_evidence ADD COLUMN file_size bigint;
  END IF;
END $$;