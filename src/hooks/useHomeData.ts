import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

// Fetch server status with caching
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

      const { data, error } = await supabase.functions.invoke('fivem-server-status');
      
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
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // Refetch every minute
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Fetch featured YouTubers with caching
export const useFeaturedYoutubers = () => {
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
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Fetch testimonials with caching
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
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
