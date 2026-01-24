import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ServerStatus {
  status: 'online' | 'offline' | 'maintenance';
  players: number;
  maxPlayers: number;
}

interface FeaturedYoutuber {
  id: string;
  name: string;
  channel_url: string;
  avatar_url: string | null;
  role: string;
  is_live: boolean;
  live_stream_url: string | null;
}

// Fetch server status with aggressive caching - ultra optimized to prevent lag
export const useServerStatus = () => {
  return useQuery<ServerStatus>({
    queryKey: ['server-status'],
    queryFn: async () => {
      // Check maintenance mode first
      const { data: maintenanceSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "server_maintenance")
        .maybeSingle();
      
      if (maintenanceSetting?.value === 'true') {
        return { status: 'maintenance' as const, players: 0, maxPlayers: 64 };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const { data, error } = await supabase.functions.invoke('fivem-server-status', {
          body: {},
        });
        
        clearTimeout(timeoutId);
        
        if (error || !data) {
          return { status: 'offline' as const, players: 0, maxPlayers: 64 };
        }

        const playerCount = typeof data.players === 'object' ? data.players.current : (data.players || 0);
        const maxCount = typeof data.players === 'object' ? data.players.max : (data.maxPlayers || 64);

        return {
          status: data.status === 'online' ? 'online' as const : 'offline' as const,
          players: playerCount,
          maxPlayers: maxCount,
        };
      } catch {
        // Silently fail - don't retry on network errors
        return { status: 'offline' as const, players: 0, maxPlayers: 64 };
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour - very long cache for performance
    gcTime: 1000 * 60 * 120, // 2 hours cache retention
    refetchInterval: false, // PERF: Disabled background polling
    retry: false, // PERF: Don't retry failed requests
    refetchOnMount: false, // PERF: Use cached data
    refetchOnWindowFocus: false, // PERF: Don't refetch on focus
    refetchOnReconnect: false, // PERF: Don't refetch on reconnect
    networkMode: 'offlineFirst', // Use cache first
  });
};

// Fetch featured YouTubers with realtime subscription for live status updates
export const useFeaturedYoutubers = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for live status updates
  useEffect(() => {
    const channel = supabase
      .channel('featured-youtubers-live')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'featured_youtubers',
        },
        (payload) => {
          // Update the cache with new data when is_live or live_stream_url changes
          queryClient.setQueryData<FeaturedYoutuber[]>(['featured-youtubers'], (old) => {
            if (!old) return old;
            return old.map((youtuber) =>
              youtuber.id === payload.new.id
                ? { ...youtuber, is_live: payload.new.is_live, live_stream_url: payload.new.live_stream_url }
                : youtuber
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<FeaturedYoutuber[]>({
    queryKey: ['featured-youtubers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_youtubers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching youtubers:', error);
        return [];
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - shorter for live updates
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
};

// Fetch testimonials with aggressive caching
export const useTestimonials = () => {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    networkMode: 'offlineFirst',
  });
};
