import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [liveCount, setLiveCount] = useState(0);
  const { toast } = useToast();
  const isInitialLoad = useRef(true);

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
      isInitialLoad.current = false;
    }
  }, [filterType]);

  useEffect(() => {
    // Reset for filter changes
    setLoading(true);
    isInitialLoad.current = true;
    loadArticles();

    // Listen to ALL events: INSERT, UPDATE, DELETE
    const channel = supabase
      .channel(`rp-news-realtime-${filterType || 'all'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rp_news_articles',
      }, (payload) => {
        const newArticle = payload.new as RpNewsArticle;
        const matchesFilter = !filterType || filterType === 'all' || newArticle.event_type === filterType;
        
        if (matchesFilter) {
          setArticles(prev => {
            // Prevent duplicates
            if (prev.some(a => a.id === newArticle.id)) return prev;
            return [newArticle, ...prev];
          });
          setLiveCount(prev => prev + 1);

          // Show breaking news toast (skip during initial load)
          if (!isInitialLoad.current) {
            toast({
              title: '🔴 BREAKING NEWS',
              description: newArticle.headline,
              duration: 8000,
            });
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rp_news_articles',
      }, (payload) => {
        const updated = payload.new as RpNewsArticle;
        setArticles(prev =>
          prev.map(a => a.id === updated.id ? updated : a)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'rp_news_articles',
      }, (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        setArticles(prev => prev.filter(a => a.id !== deletedId));
      })
      .subscribe((status) => {
        console.log('[News Realtime] Channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadArticles, filterType, toast]);

  return { articles, loading, liveCount, reload: loadArticles };
};
