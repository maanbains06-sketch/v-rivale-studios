-- Allow owner to delete news articles
CREATE POLICY "Owner can delete news articles"
ON public.rp_news_articles
FOR DELETE
USING (public.is_owner(auth.uid()));

-- Allow owner to manage (insert/update) news articles
CREATE POLICY "Owner can manage news articles"
ON public.rp_news_articles
FOR ALL
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));