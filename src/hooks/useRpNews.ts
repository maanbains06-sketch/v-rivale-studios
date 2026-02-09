import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RpNewsArticle {
  id: string;
  event_type: string;
  headline: string;
  article_body: string;
  character_name: string | null;
  location: string | null;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  event_data: Record<string, any>;
  published_at: string;
  created_at: string;
}

export const useRpNews = (filterType?: string) => {
  const [articles, setArticles] = useState<RpNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    try {
      let query = supabase
        .from('rp_news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (filterType && filterType !== 'all') {
        query = query.eq('event_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setArticles((data as any[]) || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadArticles();

    const channel = supabase
      .channel('rp-news-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rp_news_articles',
      }, (payload) => {
        const newArticle = payload.new as RpNewsArticle;
        if (!filterType || filterType === 'all' || newArticle.event_type === filterType) {
          setArticles(prev => [newArticle, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadArticles, filterType]);

  return { articles, loading, reload: loadArticles };
};
