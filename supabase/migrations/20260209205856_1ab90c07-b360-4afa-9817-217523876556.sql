
-- Add video_url column to news articles
ALTER TABLE public.rp_news_articles 
ADD COLUMN video_url TEXT,
ADD COLUMN media_type TEXT DEFAULT 'image'; -- image, video, both

-- Create storage bucket for news videos
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('news-videos', 'news-videos', true, 104857600); -- 100MB limit

-- Public read for news videos
CREATE POLICY "News videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-videos');

-- Service role can upload videos
CREATE POLICY "Service role can upload news videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-videos');
