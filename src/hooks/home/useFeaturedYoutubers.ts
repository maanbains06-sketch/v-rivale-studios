import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedYoutuber {
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

const isPageActive = () => {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
};

/**
 * Featured YouTubers:
 * - Reads from DB
 * - Realtime updates keep UI instant
 * - Lightweight background sync triggers backend refresh only when page is active
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
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
            // Recreate channel (calling channel.subscribe() repeatedly can multiply work)
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

  // Lightweight background sync (only when it can actually help)
  useEffect(() => {
    if (!hasAny) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;

      // Don’t sync when tab is hidden or offline (saves CPU + avoids perceived lag)
      if (!isPageActive() || (typeof navigator !== "undefined" && !navigator.onLine)) {
        timeoutId = setTimeout(tick, 30_000);
        return;
      }

      // De-dupe: avoid spamming sync if multiple hook instances ever mount
      const now = Date.now();
      if (now - lastSyncAtRef.current < 60_000) {
        timeoutId = setTimeout(tick, 30_000);
        return;
      }

      lastSyncAtRef.current = now;

      try {
        await supabase.functions.invoke("sync-youtube-live-status", { body: {} });
      } catch {
        // silent: realtime + DB query already keep UI usable
      }

      timeoutId = setTimeout(tick, 3 * 60_000);
    };

    // Initial sync after a short delay so it never competes with first paint
    timeoutId = setTimeout(tick, 10_000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasAny]);

  return query;
};
