-- Create storage bucket for gallery uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Create gallery_submissions table
CREATE TABLE public.gallery_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('screenshot', 'video', 'event', 'community')),
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_submissions
CREATE POLICY "Users can view approved submissions"
  ON public.gallery_submissions
  FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON public.gallery_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending submissions"
  ON public.gallery_submissions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all submissions"
  ON public.gallery_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update all submissions"
  ON public.gallery_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Storage policies for gallery bucket
CREATE POLICY "Public can view approved gallery files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'gallery' AND
    (
      EXISTS (
        SELECT 1 FROM public.gallery_submissions
        WHERE file_path = storage.objects.name
        AND status = 'approved'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Authenticated users can upload to gallery"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own gallery uploads"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'gallery' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own gallery uploads"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'gallery' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create trigger for updated_at
CREATE TRIGGER update_gallery_submissions_updated_at
  BEFORE UPDATE ON public.gallery_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();