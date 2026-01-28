import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeType = 
  | 'default' 
  | 'diwali' 
  | 'holi' 
  | 'halloween' 
  | 'winter' 
  | 'christmas' 
  | 'new_year' 
  | 'birthday';

interface UseActiveThemeReturn {
  activeTheme: ThemeType;
  loading: boolean;
  refetch: () => Promise<void>;
}

// Cache for instant loading
const CACHE_KEY = 'slrp_active_theme';

export const useActiveTheme = (): UseActiveThemeReturn => {
  const [activeTheme, setActiveTheme] = useState<ThemeType>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return cached as ThemeType;
      }
    } catch {
      // Ignore storage errors
    }
    return 'default';
  });
  const [loading, setLoading] = useState(true);

  const fetchTheme = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'active_theme')
        .single();

      if (error) {
        console.error('Error fetching active theme:', error);
        return;
      }

      if (data?.value) {
        const theme = data.value as ThemeType;
        setActiveTheme(theme);
        try {
          localStorage.setItem(CACHE_KEY, theme);
        } catch {
          // Ignore storage errors
        }
      }
    } catch (err) {
      console.error('Error in fetchTheme:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();

    // Subscribe to real-time updates for theme changes
    const channel = supabase
      .channel('active_theme_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.active_theme',
        },
        (payload) => {
          const newTheme = payload.new?.value as ThemeType;
          if (newTheme) {
            setActiveTheme(newTheme);
            try {
              localStorage.setItem(CACHE_KEY, newTheme);
            } catch {
              // Ignore storage errors
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTheme]);

  return { activeTheme, loading, refetch: fetchTheme };
};
