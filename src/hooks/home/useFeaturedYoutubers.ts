import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedYoutuber {
  id: string;
  name: string;
  channel_url: string;
  channel_id: string | null;
  avatar_url: string | null;
  role: string;
  is_live: boolean;
  live_stream_url: string | null;
  live_stream_title: string | null;
  live_stream_thumbnail: string | null;
}

const isPageActive = () => {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
};

/**
 * Featured YouTubers:
 * - Reads from DB
 * - Realtime updates keep UI instant
 * - Fast background sync triggers backend refresh for live status
 */
export const useFeaturedYoutubers = () => {
  const queryClient = useQueryClient();
  const lastSyncAtRef = useRef<number>(0);

  const query = useQuery<FeaturedYoutuber[]>({
    queryKey: ["featured-youtubers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_youtubers")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 30, // 30 seconds - refresh more frequently
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    refetchOnReconnect: true,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
    retry: 2,
  });

  const hasAny = useMemo(() => (query.data?.length ?? 0) > 0, [query.data]);

  // Realtime subscription (silent + lightweight)
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel = supabase.channel("featured-youtubers-live", {
      config: { broadcast: { self: false } },
    });

    const attach = () => {
      channel = supabase
        .channel("featured-youtubers-live", {
          config: { broadcast: { self: false } },
        })
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "featured_youtubers" },
          (payload) => {
            if (cancelled) return;

            if (payload.eventType === "UPDATE") {
              const newData = payload.new as FeaturedYoutuber;
              queryClient.setQueryData<FeaturedYoutuber[]>(["featured-youtubers"], (old) => {
                if (!old) return old;
                return old.map((y) => (y.id === newData.id ? { ...y, ...newData } : y));
              });
            } else if (payload.eventType === "INSERT") {
              queryClient.setQueryData<FeaturedYoutuber[]>(["featured-youtubers"], (old) => {
                if (!old) return [payload.new as FeaturedYoutuber];
                return [...old, payload.new as FeaturedYoutuber];
              });
            } else if (payload.eventType === "DELETE") {
              queryClient.setQueryData<FeaturedYoutuber[]>(["featured-youtubers"], (old) => {
                if (!old) return old;
                return old.filter((y) => y.id !== (payload.old as any).id);
              });
            }
          }
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            try {
              supabase.removeChannel(channel);
            } catch {
              // ignore
            }
            if (!retryTimeout) {
              retryTimeout = setTimeout(() => {
                retryTimeout = null;
                if (!cancelled) attach();
              }, 3000);
            }
          }
        });
    };

    attach();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [queryClient]);

  // Faster background sync for live status updates
  useEffect(() => {
    if (!hasAny) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;

      // Don't sync when tab is hidden or offline
      if (!isPageActive() || (typeof navigator !== "undefined" && !navigator.onLine)) {
        timeoutId = setTimeout(tick, 15_000);
        return;
      }

      // Reduced de-dupe interval for faster updates
      const now = Date.now();
      if (now - lastSyncAtRef.current < 30_000) {
        timeoutId = setTimeout(tick, 15_000);
        return;
      }

      lastSyncAtRef.current = now;

      try {
        await supabase.functions.invoke("sync-youtube-live-status", { body: {} });
        // Invalidate query to pick up any changes
        queryClient.invalidateQueries({ queryKey: ["featured-youtubers"] });
      } catch {
        // silent: realtime + DB query already keep UI usable
      }

      // Sync every 60 seconds instead of 3 minutes
      timeoutId = setTimeout(tick, 60_000);
    };

    // Initial sync after 5 seconds
    timeoutId = setTimeout(tick, 5_000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasAny, queryClient]);

  return query;
};
