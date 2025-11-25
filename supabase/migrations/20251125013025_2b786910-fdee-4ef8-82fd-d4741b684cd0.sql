-- Create helper function to increment article helpful count
CREATE OR REPLACE FUNCTION increment_article_helpful(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE knowledge_articles
  SET helpful_count = helpful_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;