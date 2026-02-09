
-- Create table for RP news articles
CREATE TABLE public.rp_news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- death, arrest, shootout, court_case, impound, event
  headline TEXT NOT NULL,
  article_body TEXT NOT NULL,
  character_name TEXT,
  location TEXT,
  image_url TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rp_news_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for news
CREATE POLICY "News articles are publicly readable"
ON public.rp_news_articles FOR SELECT
USING (true);

-- Only service role can insert/update/delete (via edge function)
CREATE POLICY "Service role can manage news articles"
ON public.rp_news_articles FOR ALL
USING (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rp_news_articles;

-- Index for performance
CREATE INDEX idx_rp_news_published_at ON public.rp_news_articles(published_at DESC);
CREATE INDEX idx_rp_news_event_type ON public.rp_news_articles(event_type);

-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true);

-- Public read for news images
CREATE POLICY "News images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

-- Service role can upload
CREATE POLICY "Service role can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images');

-- Trigger for updated_at
CREATE TRIGGER update_rp_news_articles_updated_at
BEFORE UPDATE ON public.rp_news_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
