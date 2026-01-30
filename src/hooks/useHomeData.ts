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
  live_stream_title: string | null;
  live_stream_thumbnail: string | null;
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

// Fetch featured YouTubers with robust realtime subscription for live status updates
// Also includes automatic polling to sync live status
export const useFeaturedYoutubers = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for live status updates with auto-retry
  useEffect(() => {
    let retryTimeoutId: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    const setupChannel = () => {
      if (!isSubscribed) return null;

      const channel = supabase
        .channel('featured-youtubers-live', {
          config: {
            broadcast: { self: false },
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'featured_youtubers',
          },
          (payload) => {
            console.log('Realtime YouTuber update:', payload.eventType, payload.new);
            
            if (payload.eventType === 'UPDATE') {
              // Update the cache immediately with new data including thumbnail/title
              queryClient.setQueryData<FeaturedYoutuber[]>(['featured-youtubers'], (old) => {
                if (!old) return old;
                const newData = payload.new as FeaturedYoutuber;
                return old.map((youtuber) =>
                  youtuber.id === newData.id
                    ? { 
                        ...youtuber, 
                        is_live: newData.is_live, 
                        live_stream_url: newData.live_stream_url,
                        live_stream_title: newData.live_stream_title,
                        live_stream_thumbnail: newData.live_stream_thumbnail,
                        name: newData.name,
                        avatar_url: newData.avatar_url,
                        role: newData.role,
                        channel_url: newData.channel_url,
                      }
                    : youtuber
                );
              });
            } else if (payload.eventType === 'INSERT') {
              // Add new YouTuber to cache
              queryClient.setQueryData<FeaturedYoutuber[]>(['featured-youtubers'], (old) => {
                if (!old) return [payload.new as FeaturedYoutuber];
                return [...old, payload.new as FeaturedYoutuber];
              });
            } else if (payload.eventType === 'DELETE') {
              // Remove YouTuber from cache
              queryClient.setQueryData<FeaturedYoutuber[]>(['featured-youtubers'], (old) => {
                if (!old) return old;
                return old.filter((youtuber) => youtuber.id !== (payload.old as any).id);
              });
            }
          }
        )
        .subscribe((status, err) => {
          console.log('YouTuber realtime channel status:', status, err);
          
          if (status === 'SUBSCRIBED') {
            console.log('YouTuber realtime subscription active');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('YouTuber realtime subscription error, retrying in 3s...');
            // Auto-retry on error
            if (isSubscribed) {
              retryTimeoutId = setTimeout(() => {
                channel.subscribe();
              }, 3000);
            }
          } else if (status === 'CLOSED') {
            console.log('YouTuber realtime channel closed');
          }
        });

      return channel;
    };

    const channel = setupChannel();

    return () => {
      isSubscribed = false;
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  // Periodic sync of YouTube live status - runs every 3 minutes (increased for performance)
  useEffect(() => {
    let isMounted = true;
    
    const syncLiveStatus = async () => {
      if (!isMounted) return;
      
      try {
        console.log('[YouTuber Sync] Triggering live status sync...');
        await supabase.functions.invoke('sync-youtube-live-status', {
          body: {},
        });
        console.log('[YouTuber Sync] Live status sync completed');
      } catch (err) {
        console.error('[YouTuber Sync] Failed to sync:', err);
      }
    };

    // Initial sync on mount (after a short delay to not block initial load)
    const initialTimeout = setTimeout(syncLiveStatus, 8000);
    
    // Periodic sync every 3 minutes (increased from 2 for better performance)
    const intervalId = setInterval(syncLiveStatus, 3 * 60 * 1000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, []);

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
    staleTime: 1000 * 60 * 2, // 2 minutes - shorter for live updates
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: true, // Refetch on mount to get latest data
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 1,
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
