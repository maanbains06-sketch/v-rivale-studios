-- Drop knowledge base function
DROP FUNCTION IF EXISTS public.increment_article_helpful(uuid);

-- Drop knowledge_articles table and its dependencies
DROP TABLE IF EXISTS public.knowledge_articles CASCADE;